// Old Version:-

// import { Request, Response } from "express";
// import prisma from "../lib/prisma.js";
// import openai from "../Config/OpenAI.js";

// const modelName = "qwen/qwen3-coder:free";

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

// ─────────────────────────────────────────────
// Model Fallback Lists
// Agar pehla model 429/fail kare toh next try hoga
// ─────────────────────────────────────────────
const promptModels = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "mistralai/mistral-7b-instruct:free",
];

const codeModels = [
  "qwen/qwen3-coder:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

// ─────────────────────────────────────────────
// Helper: Try models one by one until one works
// Handles 429 rate limit by falling back to next model
// ─────────────────────────────────────────────
const tryModels = async (
  models: string[],
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> => {
  let lastError: any;

  for (const model of models) {
    try {
      console.log(`[AI] Trying model: ${model}`);

      const response = await openai.chat.completions.create({
        model,
        messages,
      });

      const content =
        response.choices[0]?.message?.content ||
        (response.choices[0]?.message as any)?.reasoning_content ||
        "";

      if (content) {
        console.log(`[AI] ✅ Success with: ${model}`);
        return content;
      }

      console.warn(`[AI] Empty response from: ${model}`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI] ❌ ${model} failed: ${err.message}`);
      continue; // Try next model
    }
  }

  throw new Error(
    `All models failed. Last error: ${lastError?.message || "Unknown error"}`
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
// Controller: Get user credits
// Route: GET /api/user/credits
// ─────────────────────────────────────────────
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ credits: user.credits });
  } catch (error: any) {
    console.error("[getUserCredits Error]:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Create new project with AI generation
// Route: POST /api/user/project
// ─────────────────────────────────────────────
export const createUserProject = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const { initial_prompt } = req.body;

    // ── Auth check ──────────────────────────────────────
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ── Input validation ─────────────────────────────────
    if (!initial_prompt || initial_prompt.trim() === "") {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // ── User existence + credit check ────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits < 5) {
      return res.status(403).json({
        message: "Insufficient credits. Please purchase more credits.",
      });
    }

    // ── Create project record ─────────────────────────────
    const project = await prisma.websiteProject.create({
      data: {
        name:
          initial_prompt.length > 50
            ? initial_prompt.substring(0, 46) + "..."
            : initial_prompt,
        initial_prompt,
        userId,
      },
    });

    // ── Increment total creations ─────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: { totalCreation: { increment: 1 } },
    });

    // ── Log user message ──────────────────────────────────
    await prisma.conversation.create({
      data: {
        role: "user",
        content: initial_prompt,
        projectId: project.id,
      },
    });

    // ── Deduct credits ────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    // ── Step 1: Enhance user prompt ───────────────────────
    console.log("[createUserProject] Enhancing prompt...");
    const enhancedPrompt = await tryModels(promptModels, [
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
        content: initial_prompt,
      },
    ]);

    // ── Handle empty enhanced prompt ──────────────────────
    if (!enhancedPrompt) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Failed to enhance your prompt. Please try again.",
          projectId: project.id,
        },
      });
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
        content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
        projectId: project.id,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "Now generating your website...",
        projectId: project.id,
      },
    });

    // ── Step 2: Generate website HTML code ────────────────
    console.log("[createUserProject] Generating website code...");
    const rawCode = await tryModels(codeModels, [
      {
        role: "system",
        content: `You are an expert web developer. Create a complete, production-ready, single-page website.

CRITICAL REQUIREMENTS:
- Return ONLY valid, complete HTML. Nothing else.
- Use Tailwind CSS for ALL styling.
- Include this EXACT script in <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Use Tailwind utility classes extensively for styling, animations, and responsiveness.
- Make it fully functional and interactive with JavaScript inside <script> tag before closing </body>.
- Use modern, beautiful design with great UX using Tailwind classes.
- Make it responsive using Tailwind responsive prefixes (sm:, md:, lg:, xl:).
- Use Tailwind animations and transitions (animate-*, transition-*).
- Include all necessary meta tags in <head>.
- Use Google Fonts CDN if needed for custom fonts.
- Use placeholder images from https://placehold.co/600x400.

HARD RULES — NEVER BREAK THESE:
1. Do NOT include markdown, code fences, or backticks anywhere.
2. Do NOT include \`\`\`html or \`\`\` anywhere in your response.
3. Do NOT add explanations, notes, or comments outside the HTML.
4. Output the raw HTML document only — nothing before or after it.`,
      },
      {
        role: "user",
        content: enhancedPrompt,
      },
    ]);

    const code = stripCodeFences(rawCode);

    // ── Handle empty code response ────────────────────────
    if (!code) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Unable to generate the code. Please try again.",
          projectId: project.id,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
      return res.status(500).json({ message: "Failed to generate code" });
    }

    // ── Save initial version ──────────────────────────────
    const version = await prisma.version.create({
      data: {
        code,
        description: "Initial version",
        projectId: project.id,
      },
    });

    // ── Update project with generated code ────────────────
    await prisma.websiteProject.update({
      where: { id: project.id },
      data: {
        current_code: code,
        current_version_index: version.id,
      },
    });

    // ── Log success message ───────────────────────────────
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content:
          "I've created your website! You can now preview it and request any changes.",
        projectId: project.id,
      },
    });

    // ✅ res.json() is LAST — after all AI + DB operations
    return res.json({ projectId: project.id });
  } catch (error: any) {
    console.error("[createUserProject Error]:", error.message);

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
// Controller: Get a single user project by ID
// Route: GET /api/user/project/:projectId
// ─────────────────────────────────────────────
export const getUserProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: {
        conversation: { orderBy: { timestamp: "asc" } },
        versions: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ project });
  } catch (error: any) {
    console.error("[getUserProject Error]:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Get all projects of current user
// Route: GET /api/user/projects
// ─────────────────────────────────────────────
export const getAllUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await prisma.websiteProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({ projects });
  } catch (error: any) {
    console.error("[getAllUserProjects Error]:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Toggle project publish status
// Route: PUT /api/user/project/:projectId/publish
// ─────────────────────────────────────────────
export const togglePublish = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: { isPublished: !project.isPublished },
    });

    return res.json({
      message: project.isPublished
        ? "Project unpublished successfully"
        : "Project published successfully",
    });
  } catch (error: any) {
    console.error("[togglePublish Error]:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: Purchase credits
// Route: POST /api/user/buy-credits
// ─────────────────────────────────────────────
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    interface Plan {
      credits: number;
      amount: number;
    }

    const plans: Record<string, Plan> = {
      basic:      { credits: 50,  amount: 9  },
      pro:        { credits: 100, amount: 19 },
      enterprise: { credits: 250, amount: 49 },
    };

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { planId } = req.body as { planId: string };
    const plan = plans[planId];

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    await prisma.transaction.create({
      data: {
        userId,
        planId,
        amount: plan.amount,
        credits: plan.credits,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: plan.credits } },
    });

    return res.json({
      message: `Successfully purchased ${plan.credits} credits`,
      credits: plan.credits,
    });
  } catch (error: any) {
    console.error("[purchaseCredits Error]:", error);
    return res.status(500).json({ message: error.message });
  }
};
