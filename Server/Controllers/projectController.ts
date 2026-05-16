// Old Version :-
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


// New Version :- 
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../Config/OpenAI.js";

const modelName = "deepseek/deepseek-v4-flash:free";

// Helper function to extract only the HTML content from markdown fences
const extractHtmlOnly = (rawResponse: string): string => {
  const htmlRegex = new RegExp("```html\\s*([\\s\\S]*?)\\s*```", "i");
  const genericRegex = new RegExp("```([\\s\\S]*?)\\s*```");

  const match = rawResponse.match(htmlRegex) || rawResponse.match(genericRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  return rawResponse.trim();
};

// Controller fn to make revision
export const makeRevision = async (req: Request, res: Response) => {
  const userId = req.userId;
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userId || !user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.credits < 5) {
      return res.status(403).json({
        message: "add more credits to make changes",
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        message: "Please enter a valid prompt",
      });
    }

    const currentProject = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!currentProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // update conversation
    await prisma.conversation.create({
      data: {
        role: "user",
        content: message,
        projectId,
      },
    });

    // update credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    // enhance user prompt response
    const promptEnhanceResponse = await openai.chat.completions.create({
      model: modelName,
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

            Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`
        },
        {
          role: "user",
          content: `User's request: "${message}"`,
        },
      ],
    });

    // enhance user prompt by extracting from promptEnhanceResponse
    const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

    // update conversion
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
        content: "Now making changes to your website",
        projectId,
      },
    });

    // generate website code
    const codeGenerationResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are an expert web developer. 
                  CRITICAL REQUIREMENTS:
                  - Return the complete updated HTML code inside a standard markdown code block (\`\`\`html ... \`\`\`).
                  - Use Tailwind CSS for ALL styling (NO custom CSS).
                  - Use Tailwind utility classes for all styling changes.
                  - Include all JavaScript in <script> tags before closing </body>
                  - Make sure it's a complete, standalone HTML document with Tailwind CSS
                  - Apply the requested changes while maintaining the Tailwind CSS styling approach.`
        },
        {
          role: "user",
          content: `Here is the current website code: "${currentProject.current_code}" The user wants this change: "${enhancedPrompt}"`,
        },
      ],
    });

    // extract website code from codeGenerationResponse
    const rawCode = codeGenerationResponse.choices[0].message.content || "";

    if (!rawCode) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Unable to generate the code, please try again",
          projectId,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
      return res.status(500).json({
        message: "Failed to generate code",
      });
    }

    // Process code clean up using the helper function
    const cleanCode = extractHtmlOnly(rawCode);

    // Updates version
    const version = await prisma.version.create({
      data: {
        code: cleanCode,
        description: "changes made",
        projectId,
      },
    });

    // update conversation
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "I've made the changes to your website! You can now preview it",
        projectId,
      },
    });

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: cleanCode,
        current_version_index: version.id,
      },
    });

    res.json({ message: "Change made successfully" });
  } catch (error: any) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 5 } },
    });
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Controller fn to rollback to a specific version
export const rollbackToVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { projectId, versionId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const version = project.versions.find(
      (version) => version.id === versionId
    );

    if (!version) {
      return res.status(404).json({
        message: "Version not found",
      });
    }

    // update current code
    await prisma.websiteProject.update({
      where: { id: projectId, userId },
      data: {
        current_code: version.code,
        current_version_index: version.id,
      },
    });

    // update conversation
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "I've rolled back your website to the selected version. You can now preview it.",
        projectId,
      },
    });
    res.json({
      message: "Version rolled back",
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Controller fn to delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    await prisma.websiteProject.delete({
      where: { id: projectId, userId },
    });

    res.json({
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Controller for getting project code for preview
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

    res.json({ project });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Controller fn for get published Projects
export const getPublishedProject = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.websiteProject.findMany({
      where: { isPublished: true },
      include: { user: true },
    });

    res.json({ projects });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get single project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project || project.isPublished === false || !project?.current_code) {
      return res.status(401).json({
        message: "Project not found",
      });
    }

    res.json({ code: project.current_code });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Controller to save project code
export const saveProjectCode = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!code) {
      return res.status(400).json({
        message: "Code is required",
      });
    }

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(400).json({
        message: "Project not found",
      });
    }

    // update project
    await prisma.websiteProject.update({
      where: { id: projectId },
      data: { current_code: code, current_version_index: "" },
    });

    res.json({ message: "Project saved successfully" });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};
