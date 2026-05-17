// Old Version:-
// import { Request, Response } from "express";
// import prisma from "../lib/prisma.js";
// import openai from "../Config/OpenAI.js";

// const modelName = "deepseek/deepseek-v4-flash:free";

// // Controller fn to make revision
// export const makeRevision = async (req: Request, res: Response) => {
//   const userId = req.userId;
//   try {
//     const { projectId } = req.params;
//     const { message } = req.body;

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!userId || !user) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     if (user.credits < 5) {
//       return res.status(403).json({
//         message: "add more credits to make changes",
//       });
//     }

//     if (!message || message.trim() === "") {
//       return res.status(400).json({
//         message: "Please enter a valid prompt",
//       });
//     }

//     const currentProject = await prisma.websiteProject.findUnique({
//       where: { id: projectId, userId },
//       include: { versions: true },
//     });

//     if (!currentProject) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     // update conversation
//     await prisma.conversation.create({
//       data: {
//         role: "user",
//         content: message,
//         projectId,
//       },
//     });

//     // update credits
//     await prisma.user.update({
//       where: { id: userId },
//       data: { credits: { decrement: 5 } },
//     });

//     // enhance user prompt response
//     const promptEnhanceResponse = await openai.chat.completions.create({
//       model: modelName,
//       messages: [
//         {
//           role: "system",
//           content: `You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.
//             Enhance this prompt by:
//             1. Adding specific design details (layout, color scheme, typography)
//             2. Specifying key sections and features
//             3. Describing the user experience and interactions
//             4. Including modern web design best practices
//             5. Mentioning responsive design requirements
//             6. Adding any missing but important elements

//             Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`
//         },
//         {
//           role: "user",
//           content: `User's request: "${message}"`,
//         },
//       ],
//     });

//     // enhance user prompt by extracting from promptEnhanceResponse
//     const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

//     // update conversion
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content: `I have enhanced your prompt to: "${enhancedPrompt}"`,
//         projectId,
//       },
//     });
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content: "Now making changes to your website",
//         projectId,
//       },
//     });

//     // generate website code
//     const codeGenerationResponse = await openai.chat.completions.create({
//       model: modelName,
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert web developer. 
//                   CRITICAL REQUIREMENTS:
//                   - Return ONLY the complete updated HTML code with the requested changes.
//                   - Use Tailwind CSS for ALL styling (NO custom CSS).
//                   - Use Tailwind utility classes for all styling changes.
//                   - Include all JavaScript in <script> tags before closing </body>
//                   - Make sure it's a complete, standalone HTML document with Tailwind CSS
//                   - Return the HTML Code Only, nothing else

//                   Apply the requested changes while maintaining the Tailwind CSS styling approach.`
//         },
//         {
//           role: "user",
//           content: `Here is the current website code: "${currentProject.current_code}" The user wants this change: "${enhancedPrompt}"`,
//         },
//       ],
//     });

//     // extract website code from codeGenerationResponse
//     const code = codeGenerationResponse.choices[0].message.content || "";

//     if (!code) {
//       await prisma.conversation.create({
//         data: {
//           role: "assistant",
//           content: "Unable to generate the code, please try again",
//           projectId,
//         },
//       });
//       await prisma.user.update({
//         where: { id: userId },
//         data: { credits: { increment: 5 } },
//       });
//       return res.status(500).json({
//         message: "Failed to generate code",
//       });;
//     }

//     // Updates version
//     const version = await prisma.version.create({
//       data: {
//         code: code
//           .replace(/```[a-z]*\n?/gi, "")
//           .replace(/```$/g, "")
//           .trim(),
//         description: "changes made",
//         projectId,
//       },
//     });

//     // update connversation
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content:
//           "I've made the changes to your website! You can now preview it",
//         projectId,
//       },
//     });

//     await prisma.websiteProject.update({
//       where: { id: projectId },
//       data: {
//         current_code: code
//           .replace(/```[a-z]*\n?/gi, "")
//           .replace(/```$/g, "")
//           .trim(),
//         current_version_index: version.id,
//       },
//     });

//     res.json({ message: "Change made successfully" });
//   } catch (error: any) {
//     await prisma.user.update({
//       where: { id: userId },
//       data: { credits: { increment: 5 } },
//     });
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller fn to rollback to a specific version
// export const rollbackToVersion = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const { projectId, versionId } = req.params;

//     const project = await prisma.websiteProject.findUnique({
//       where: { id: projectId, userId },
//       include: { versions: true },
//     });

//     if (!project) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     const version = project.versions.find(
//       (version) => version.id === versionId
//     );

//     if (!version) {
//       return res.status(404).json({
//         message: "Version not found",
//       });
//     }

//     // update current code
//     await prisma.websiteProject.update({
//       where: { id: projectId, userId },
//       data: {
//         current_code: version.code,
//         current_version_index: version.id,
//       },
//     });

//     // update conversation
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content:
//           "I've rolled back your website to the selected version. You can now preview it.",
//         projectId,
//       },
//     });
//     res.json({
//       message: "Version rolled back",
//     });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller fn to delete project
// export const deleteProject = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     const { projectId } = req.params;
//     await prisma.websiteProject.delete({
//       where: { id: projectId, userId },
//     });

//     res.json({
//       message: "Project deleted successfully",
//     });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller for getting project code for preview
// export const getProjectPreview = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     const { projectId } = req.params;

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const project = await prisma.websiteProject.findFirst({
//       where: { id: projectId, userId },
//       include: { versions: true },
//     });

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     res.json({ project });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller fn for get published Projects
// export const getPublishedProject = async (req: Request, res: Response) => {
//   try {
//     const projects = await prisma.websiteProject.findMany({
//       where: { isPublished: true },
//       include: { user: true },
//     });

//     res.json({ projects });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Get single project by if
// export const getProjectById = async (req: Request, res: Response) => {
//   try {
//     const { projectId } = req.params;
//     const project = await prisma.websiteProject.findFirst({
//       where: { id: projectId },
//       include: { user: true },
//     });

//     if (!project || project.isPublished === false || !project?.current_code) {
//       return res.status(401).json({
//         message: "Project not found",
//       });
//     }

//     res.json({ code: project.current_code });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller to save project code
// export const saveProjectCode = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     const { projectId } = req.params;
//     const { code } = req.body;

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!code) {
//       return res.status(400).json({
//         message: "Code is required",
//       });
//     }

//     const project = await prisma.websiteProject.findUnique({
//       where: { id: projectId, userId },
//     });

//     if (!project) {
//       return res.status(400).json({
//         message: "Project not found",
//       });
//     }

//     // update project
//     await prisma.websiteProject.update({
//       where: { id: projectId },
//       data: { current_code: code, current_version_index: "" },
//     });

//     res.json({ message: "Project saved successfully" });
//   } catch (error: any) {
//     console.error(error.message);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };


// NEW VERSION:-
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../Config/OpenAI.js";

// ✅ FIX #1 — Use two real, verified models from OpenRouter
const promptModel = "meta-llama/llama-3.3-70b-instruct:free"; // For prompt enhancement
const codeModel = "qwen/qwen3-coder-480b-a22b:free"; // For HTML code generation (best free coding model)

// ─────────────────────────────────────────────
// Helper: Safe content extractor
// Handles both normal models and reasoning models (e.g. DeepSeek R1)
// ─────────────────────────────────────────────
const extractContent = (message: any): string => {
  return (
    message?.content ||
    message?.reasoning_content || // fallback for reasoning models
    ""
  );
};

// ─────────────────────────────────────────────
// Helper: Strip markdown code fences from AI output
// ─────────────────────────────────────────────
const stripCodeFences = (code: string): string => {
  return code
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```$/g, "")
    .trim();
};

// ─────────────────────────────────────────────
// Controller: Make AI Revision
// Route: POST /api/project/:projectId/revise
// ─────────────────────────────────────────────
export const makeRevision = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const { projectId } = req.params;
    const { message } = req.body;

    // ── Auth check ──────────────────────────────────────
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ── Credit check ─────────────────────────────────────
    if (user.credits < 5) {
      return res.status(403).json({
        message: "Insufficient credits. Please purchase more to make changes.",
      });
    }

    // ── Input validation ─────────────────────────────────
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Please enter a valid prompt" });
    }

    // ── Project existence check ──────────────────────────
    const currentProject = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!currentProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ── Log user message ─────────────────────────────────
    await prisma.conversation.create({
      data: { role: "user", content: message, projectId },
    });

    // ── Deduct credits ────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    // ── Step 1: Enhance user prompt ───────────────────────
    const promptEnhanceResponse = await openai.chat.completions.create({
      model: promptModel, // ✅ uses llama for instruction following
      messages: [
        {
          role: "system",
          content: `You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.
Enhance this prompt by:
1. Adding specific design details (layout, color scheme, typography)
2. Specifying key sections and features
3. Describing the user experience and interactions
4. Including modern web design best practices
5. Mentioning responsive design requirements
6. Adding any missing but important elements

Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`,
        },
        {
          role: "user",
          content: `User's request: "${message}"`,
        },
      ],
    });

    // ✅ FIX #2 — Safe extraction handles both normal + reasoning models
    const enhancedPrompt = extractContent(
      promptEnhanceResponse.choices[0].message
    );

    if (!enhancedPrompt) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Failed to enhance your prompt. Please try again.",
          projectId,
        },
      });
      // Refund credits
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
      return res.status(500).json({ message: "Failed to enhance prompt" });
    }

    // ── Log enhanced prompt ───────────────────────────────
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I have enhanced your prompt to: "${enhancedPrompt}"`,
        projectId,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "Now making changes to your website...",
        projectId,
      },
    });

    // ── Step 2: Generate updated website code ─────────────
    const codeGenerationResponse = await openai.chat.completions.create({
      model: codeModel, // ✅ uses Qwen Coder — best free coding model
      messages: [
        {
          role: "system",
          content: `You are an expert web developer.

CRITICAL REQUIREMENTS:
- Return ONLY the complete updated HTML code with the requested changes.
- Use Tailwind CSS for ALL styling via CDN: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Use Tailwind utility classes for all styling, animations, and responsiveness.
- Include all JavaScript inside <script> tags before closing </body>.
- Return a complete, standalone HTML document. Nothing else.
- Do NOT include markdown, code fences, explanations, or comments outside the HTML.
- Do NOT include \`\`\`html or \`\`\` anywhere in your response.

Apply the requested changes while keeping the existing design intact unless told otherwise.`,
        },
        {
          role: "user",
          content: `Here is the current website code:\n\n${currentProject.current_code}\n\nApply this change: ${enhancedPrompt}`,
        },
      ],
    });

    // ✅ FIX #2 — Safe extraction
    const rawCode = extractContent(codeGenerationResponse.choices[0].message);
    const code = stripCodeFences(rawCode);

    // ── Handle empty code response ────────────────────────
    if (!code) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Unable to generate the code. Please try again.",
          projectId,
        },
      });
      // Refund credits
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
      return res.status(500).json({ message: "Failed to generate code" });
    }

    // ── Save new version ──────────────────────────────────
    const version = await prisma.version.create({
      data: {
        code,
        description: message.substring(0, 100), // Save a snippet of the user's request
        projectId,
      },
    });

    // ── Update project with new code ──────────────────────
    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: code,
        current_version_index: version.id,
      },
    });

    // ── Log success message ───────────────────────────────
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "I've made the changes to your website! You can now preview it.",
        projectId,
      },
    });

    // ✅ FIX #3 — res.json() sent AFTER everything is saved (not before)
    return res.json({ message: "Change made successfully" });

  } catch (error: any) {
    console.error("[makeRevision Error]:", error);

    // Refund credits on unexpected crash
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
    }

    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Rollback to a specific version
// Route: POST /api/project/:projectId/rollback/:versionId
// ─────────────────────────────────────────────
export const rollbackToVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId, versionId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const version = project.versions.find((v) => v.id === versionId);

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    // ── Rollback to selected version ──────────────────────
    await prisma.websiteProject.update({
      where: { id: projectId, userId },
      data: {
        current_code: version.code,
        current_version_index: version.id,
      },
    });

    // ── Log rollback ──────────────────────────────────────
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content:
          "I've rolled back your website to the selected version. You can now preview it.",
        projectId,
      },
    });

    return res.json({ message: "Version rolled back successfully" });

  } catch (error: any) {
    console.error("[rollbackToVersion Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Delete project
// Route: DELETE /api/project/:projectId
// ─────────────────────────────────────────────
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.websiteProject.delete({
      where: { id: projectId, userId },
    });

    return res.json({ message: "Project deleted successfully" });

  } catch (error: any) {
    console.error("[deleteProject Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Get project code for preview
// Route: GET /api/project/:projectId/preview
// ─────────────────────────────────────────────
export const getProjectPreview = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ project });

  } catch (error: any) {
    console.error("[getProjectPreview Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Get all published projects
// Route: GET /api/project/published
// ─────────────────────────────────────────────
export const getPublishedProject = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.websiteProject.findMany({
      where: { isPublished: true },
      include: { user: true },
    });

    return res.json({ projects });

  } catch (error: any) {
    console.error("[getPublishedProject Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Get single published project by ID
// Route: GET /api/project/view/:projectId
// ─────────────────────────────────────────────
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project || !project.isPublished || !project.current_code) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ code: project.current_code });

  } catch (error: any) {
    console.error("[getProjectById Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Save manually edited project code
// Route: PUT /api/project/:projectId/save
// ─────────────────────────────────────────────
export const saveProjectCode = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: { current_code: code, current_version_index: "" },
    });

    return res.json({ message: "Project saved successfully" });

  } catch (error: any) {
    console.error("[saveProjectCode Error]:", error.message);
    return res.status(500).json({ message: error.message });
  }
};
