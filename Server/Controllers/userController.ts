// OLD VERSION:-

// import { Request, Response } from "express";
// import prisma from "../lib/prisma.js";
// import openai from "../Config/OpenAI.js";

// const modelName = "deepseek/deepseek-v4-flash:free";

// // Get user credits
// export const getUserCredits = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     res.json({ credits: user?.credits });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller fn to create new project
// export const createUserProject = async (req: Request, res: Response) => {
//   const userId = req.userId;
//   try {
//     const { initial_prompt } = req.body;

//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     if (!initial_prompt || initial_prompt.trim() === "") {
//       return res.status(400).json({ message: "Prompt is required" });
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.credits < 5) {
//       return res.status(403).json({
//         message: "Insufficient credits. Please purchase more credits."
//       });
//     }

//     // create new project
//     const project = await prisma.websiteProject.create({
//       data: {
//         name:
//           initial_prompt.length > 50
//             ? initial_prompt.substring(0, 46) + "..."
//             : initial_prompt,
//         initial_prompt,
//         userId,
//       },
//     });

//     // Update user's total creation for increment
//     await prisma.user.update({
//       where: { id: userId },
//       data: { totalCreation: { increment: 1 } },
//     });

//     // Conversation data
//     await prisma.conversation.create({
//       data: {
//         role: "user",
//         content: initial_prompt,
//         projectId: project.id,
//       },
//     });

//     // Update user's total creation for decrement
//     await prisma.user.update({
//       where: { id: userId },
//       data: { credits: { decrement: 5 } },
//     });

//     res.json({ projectId: project.id });

//     // Enhance user prompt
//     const promptEnhanceResponse = await openai.chat.completions.create({
//       model: modelName,
//       messages: [
//         {
//           role: "system",
//           content: ` You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.
//             Enhance this prompt by:
//             1. Adding specific design details (layout, color scheme, typography)
//             2. Specifying key sections and features
//             3. Describing the user experience and interactions
//             4. Including modern web design best practices
//             5. Mentioning responsive design requirements
//             6. Adding any missing but important elements

//             Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`,
//         },
//         {
//           role: "user",
//           content: initial_prompt,
//         },
//       ],
//     });

//     const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

//     // Update conversation
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
//         projectId: project.id,
//       },
//     });

//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content: `Now generating your website...`,
//         projectId: project.id,
//       },
//     });

//     // Generate website code
//     const codeGenerationResponse = await openai.chat.completions.create({
//       model: modelName,
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}."
//             CRITICAL REQUIREMENTS:
//             - You MUST output valid HTML ONLY. 
//             - Use Tailwind CSS for ALL styling
//             - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
//             - Use Tailwind utility classes extensively for styling, animations, and responsiveness
//             - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
//             - Use modern, beautiful design with great UX using Tailwind classes
//             - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
//             - Use Tailwind animations and transitions (animate-*, transition-*)
//             - Include all necessary meta tags
//             - Use Google Fonts CDN if needed for custom fonts
//             - Use placeholder images from https://placehold.co/600x400
//             - Use Tailwind gradient classes for beautiful backgrounds
//             - Make sure all buttons, cards, and components use Tailwind styling

//             CRITICAL HARD RULES:
//             1. You MUST put ALL output ONLY into the message. content.
//             2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
//             3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
//             4. Do NOT include markdown, explanations, notes, or code fences.

//             The HTML should be complete and ready to render as-is with Tailwind CSS.`,
//         },
//         {
//           role: "user",
//           content: enhancedPrompt || "",
//         },
//       ],
//     });

//     const code = codeGenerationResponse.choices[0].message.content || "";

//     if (!code) {
//       await prisma.conversation.create({
//         data: {
//           role: "assistant",
//           content: "Unable to generate the code, please try again",
//           projectId: project.id,
//         },
//       });
//       await prisma.user.update({
//         where: { id: userId },
//         data: { credits: { increment: 5 } },
//       });
//       return;
//     }

//     // Create version for the project
//     const version = await prisma.version.create({
//       data: {
//         code: code
//           .replace(/```[a-z]*\n?/gi, "")
//           .replace(/```$/g, "")
//           .trim(),
//         description: "Initial version",
//         projectId: project.id,
//       },
//     });

//     // Update conversion
//     await prisma.conversation.create({
//       data: {
//         role: "assistant",
//         content:
//           "I've created your website! You can now preview it and request any changes.",
//         projectId: project.id,
//       },
//     });

//     // Update website project
//     await prisma.websiteProject.update({
//       where: { id: project.id },
//       data: {
//         current_code: code
//           .replace(/```[a-z]*\n?/gi, "")
//           .replace(/```$/g, "")
//           .trim(),
//         current_version_index: version.id,
//       },
//     });
//   } catch (error: any) {
//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         credits: { increment: 5 },
//       },
//     });
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller function to get a single user project
// export const getUserProject = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const { projectId } = req.params;

//     const project = await prisma.websiteProject.findUnique({
//       where: { id: projectId, userId },
//       include: {
//         conversation: {
//           orderBy: { timestamp: "asc" },
//         },
//         versions: { orderBy: { timestamp: "asc" } },
//       },
//     });

//     res.json({ project });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller function to get all user projects
// export const getAllUserProjects = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const projects = await prisma.websiteProject.findMany({
//       where: { userId },
//       orderBy: { updatedAt: "desc" },
//     });

//     res.json({ projects });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller function to toggle project publish
// export const togglePublish = async (req: Request, res: Response) => {
//   try {
//     const userId = req.userId;
//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const { projectId } = req.params;

//     const project = await prisma.websiteProject.findUnique({
//       where: { id: projectId, userId },
//     });

//     if (!project) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     await prisma.websiteProject.update({
//       where: { id: projectId },
//       data: { isPublished: !project.isPublished },
//     });

//     res.json({
//       message: project.isPublished
//         ? "Project unpublished"
//         : "Project publish successfully",
//     });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Controller function to purchase credit
// export const purchaseCredits = async (req: Request, res: Response) => {
//   try {
//     interface Plan {
//       credits: number;
//       amount: number;
//     }
//     const plans = {
//       basic: { credits: 50, amount: 9 },
//       pro: { credits: 100, amount: 19 },
//       enterprise: { credits: 250, amount: 49 },
//     };

//     const userId = req.userId;

//     const { planId } = req.body as { planId: keyof typeof plans };

//     const plan: Plan = plans[planId];
//     if (!plan) {
//       return res.status(404).json({ message: "Plan not found" });
//     }

//     const transaction = await prisma.transaction.create({
//       data: {
//         userId: userId!,
//         planId: req.body.planId,
//         amount: plan.amount,
//         credits: plan.credits,
//       },
//     });
//   } catch (error) {}
// };


// NEW VERSION:-

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../Config/OpenAI.js";

// ✅ FIX #1 — Two real, verified free models from OpenRouter
const promptModel = "meta-llama/llama-3.3-70b-instruct:free"; // For prompt enhancement
const codeModel = "qwen/qwen3-coder:free";          // For HTML code generation

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
// Route: POST /api/user/project/create
//
// ✅ FIX #2 (CRITICAL) — res.json() is now sent AFTER all AI
// operations complete. Previously it was sent before AI ran,
// which caused silent failures and blank websites.
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

    // ── User existence check ─────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ── Credit check ─────────────────────────────────────
    if (user.credits < 5) {
      return res.status(403).json({
        message: "Insufficient credits. Please purchase more credits.",
      });
    }

    // ── Create project record in DB ───────────────────────
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

    // ── Increment user total creations ────────────────────
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
    const promptEnhanceResponse = await openai.chat.completions.create({
      model: promptModel, // ✅ llama for instruction following
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
          content: initial_prompt,
        },
      ],
    });

    // ✅ FIX #3 — Safe extraction handles normal + reasoning models
    const enhancedPrompt = extractContent(
      promptEnhanceResponse.choices[0].message
    );

    // ── Handle empty enhanced prompt ──────────────────────
    if (!enhancedPrompt) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "Failed to enhance your prompt. Please try again.",
          projectId: project.id,
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
    const codeGenerationResponse = await openai.chat.completions.create({
      model: codeModel, // ✅ Qwen Coder — best free coding model
      messages: [
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
- Use Tailwind gradient classes for beautiful backgrounds.

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
      ],
    });

    // ✅ FIX #3 — Safe extraction + strip any leftover fences
    const rawCode = extractContent(codeGenerationResponse.choices[0].message);
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
      // Refund credits
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

    // ✅ FIX #2 — res.json() sent LAST, after all AI + DB operations
    return res.json({ projectId: project.id });

  } catch (error: any) {
    console.error("[createUserProject Error]:", error);

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

    // ── Create transaction record ─────────────────────────
    await prisma.transaction.create({
      data: {
        userId,
        planId,
        amount: plan.amount,
        credits: plan.credits,
      },
    });

    // ── Add credits to user account ───────────────────────
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
