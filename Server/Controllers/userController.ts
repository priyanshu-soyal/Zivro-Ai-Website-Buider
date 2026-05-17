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

const modelName = "openai/gpt-oss-120b:free";

// Extract text content from OpenRouter/OpenAI chat completion response.
function extractContent(response: any): string {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  // Some providers may return content as an array of parts.
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

// Remove markdown code fences.
function cleanCode(code: string): string {
  return code
    .replace(/^```html\s*/i, "")
    .replace(/^```javascript\s*/i, "")
    .replace(/^```js\s*/i, "")
    .replace(/^```css\s*/i, "")
    .replace(/```$/gi, "")
    .trim();
}

// Validate that output looks like a complete HTML document.
function isValidHtml(code: string): boolean {
  if (!code) return false;

  const normalized = code.toLowerCase();

  return (
    normalized.includes("<html") &&
    normalized.includes("</html>") &&
    normalized.includes("<body") &&
    normalized.includes("</body>")
  );
}

// Generate enhanced prompt from user input.
async function generateEnhancedPrompt(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: `
You are a prompt enhancement specialist.

Take the user's website request and expand it into a detailed but concise prompt.

Enhance the prompt by:
1. Add layout and design details
2. Add color scheme and typography suggestions
3. Specify important sections
4. Describe user interactions
5. Ensure responsive design
6. Include modern web design best practices

Return ONLY the enhanced prompt.
No explanations.
2-3 paragraphs maximum.
        `.trim(),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const enhancedPrompt = extractContent(response);

  if (!enhancedPrompt) {
    throw new Error("Failed to generate enhanced prompt.");
  }

  return enhancedPrompt;
}

// Generate complete website HTML.
async function generateWebsiteCode(enhancedPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: `
You are an expert full-stack web developer.

Create a complete, production-ready, beautiful single-page website.

CRITICAL REQUIREMENTS:
- Return ONLY a complete HTML document.
- Use Tailwind CSS for ALL styling.
- Include this EXACT script inside <head>:
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Use responsive Tailwind classes (sm:, md:, lg:, xl:).
- Use gradients, transitions, hover effects, and modern design.
- Include all JavaScript inside a <script> tag before </body>.
- Include meta charset and viewport tags.
- Use placeholder images from https://placehold.co/600x400.
- Do NOT return markdown.
- Do NOT return explanations.
- Do NOT use code fences.
- Output valid HTML only.
        `.trim(),
      },
      {
        role: "user",
        content: enhancedPrompt,
      },
    ],
    temperature: 0.7,
  });

  console.log(
    "Raw model response:",
    JSON.stringify(response?.choices?.[0], null, 2)
  );

  const rawCode = extractContent(response);
  const code = cleanCode(rawCode);

  console.log("Generated code length:", code.length);
  console.log("Generated code preview:", code.slice(0, 300));

  if (!isValidHtml(code)) {
    throw new Error("Model did not return valid HTML.");
  }

  return code;
}

// Refund 5 credits to the user.
async function refundCredits(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { increment: 5 },
    },
  });
}

// Get current user's credits.
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    res.json({
      credits: user?.credits ?? 0,
    });
  } catch (error: any) {
    console.error("getUserCredits error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Create a new AI-generated website project.
export const createUserProject = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const { initial_prompt } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!initial_prompt || initial_prompt.trim() === "") {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.credits < 5) {
      return res.status(403).json({
        message: "Insufficient credits. Please purchase more credits.",
      });
    }

    // Create project
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

    // Increment total creations
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalCreation: {
          increment: 1,
        },
      },
    });

    // Save initial user prompt to conversation
    await prisma.conversation.create({
      data: {
        role: "user",
        content: initial_prompt,
        projectId: project.id,
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 5,
        },
      },
    });

    // Generate enhanced prompt
    const enhancedPrompt = await generateEnhancedPrompt(initial_prompt);

    // Save enhanced prompt to conversation
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
        projectId: project.id,
      },
    });

    // Save generation status
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "Now generating your website...",
        projectId: project.id,
      },
    });

    // Generate website code
    const code = await generateWebsiteCode(enhancedPrompt);

    // Create initial version
    const version = await prisma.version.create({
      data: {
        code,
        description: "Initial version",
        projectId: project.id,
      },
    });

    // Update project with generated code
    await prisma.websiteProject.update({
      where: { id: project.id },
      data: {
        current_code: code,
        current_version_index: version.id,
      },
    });

    // Save success message to conversation
    await prisma.conversation.create({
      data: {
        role: "assistant",
        content:
          "I've created your website! You can now preview it and request any changes.",
        projectId: project.id,
      },
    });

    // IMPORTANT: Send response only after generation completes successfully
    
    res.json({
      message: "Website created successfully",
      projectId: project.id,
    });
  } catch (error: any) {
    // Refund credits if something failed
    if (userId) {
      await refundCredits(userId);
    }

    console.error("createUserProject error:", error);

    res.status(500).json({
      message: error.message || "Failed to create website",
    });
  }
};

// Get a single user project with conversation and versions.
export const getUserProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: {
        id: projectId,
        userId,
      },
      include: {
        conversation: {
          orderBy: {
            timestamp: "asc",
          },
        },
        versions: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json({
      project,
    });
  } catch (error: any) {
    console.error("getUserProject error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all projects belonging to the current user.
export const getAllUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const projects = await prisma.websiteProject.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json({
      projects,
    });
  } catch (error: any) {
    console.error("getAllUserProjects error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Publish or unpublish a project.
export const togglePublish = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await prisma.websiteProject.update({
      where: {
        id: projectId,
      },
      data: {
        isPublished: !project.isPublished,
      },
    });

    res.json({
      message: project.isPublished
        ? "Project unpublished"
        : "Project published successfully",
    });
  } catch (error: any) {
    console.error("togglePublish error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Purchase credits (placeholder implementation).
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    interface Plan {
      credits: number;
      amount: number;
    }

    const plans = {
      basic: { credits: 50, amount: 9 },
      pro: { credits: 100, amount: 19 },
      enterprise: { credits: 250, amount: 49 },
    };

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { planId } = req.body as {
      planId: keyof typeof plans;
    };

    const plan: Plan = plans[planId];

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
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
      where: {
        id: userId,
      },
      data: {
        credits: {
          increment: plan.credits,
        },
      },
    });

    res.json({
      message: "Credits purchased successfully",
      creditsAdded: plan.credits,
    });
  } catch (error: any) {
    console.error("purchaseCredits error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};


