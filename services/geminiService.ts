
import { GoogleGenAI, Type } from "@google/genai";
import { Question, IncorrectAnswer, QuestionLevel, SUBTOPIC_SUGGESTIONS } from '../types';

if (!process.env.API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Model Configuration
// 'gemini-3-pro-preview': The latest model for complex reasoning, logic, and deep explanations.
const reasoningModel = 'gemini-3-pro-preview';

// 'gemini-2.5-flash': The latest fast model for feedback and simple tasks.
const fastModel = 'gemini-2.5-flash';

export const generateQuestionWithAi = async (topic: string): Promise<Omit<Question, 'id' | 'level'>> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not configured.");
  }

  const subtopicList = SUBTOPIC_SUGGESTIONS.join(', ');

  const prompt = `Generate a challenging multiple-choice question (MCQ) for a Public Service Commission (PSC) exam based on the topic: "${topic}". 
  The question should be clear, unambiguous, and relevant to typical PSC syllabus. 
  Provide exactly 4 distinct options. Indicate the correct answer index (from 0 to 3). 
  Use LaTeX formatting for any mathematical equations (e.g. $E=mc^2$).
  
  Also, classify the question into one of the following subtopics based on its content: ${subtopicList}, or 'General'.`;

  try {
    const response = await ai.models.generateContent({
        model: reasoningModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            // Enable thinking for better quality generation
            thinkingConfig: { thinkingBudget: 1024 },
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The text of the multiple-choice question." },
                    options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of exactly 4 string options for the question."
                    },
                    correct_answer_index: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the options array." },
                    subtopic: { type: Type.STRING, description: "The detected subtopic from the provided list." }
                },
                required: ["question", "options", "correct_answer_index", "subtopic"]
            }
        }
    });

    const parsedResponse = JSON.parse(response.text);

    if (
      !parsedResponse.question ||
      !Array.isArray(parsedResponse.options) ||
      parsedResponse.options.length !== 4 ||
      typeof parsedResponse.correct_answer_index !== 'number' ||
      parsedResponse.correct_answer_index < 0 ||
      parsedResponse.correct_answer_index > 3
    ) {
      throw new Error("AI returned data in an invalid format.");
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Error generating question with AI:", error);
    throw new Error("Failed to generate question. Please try again or check the topic.");
  }
};


export const getExplanationWithAi = async (question: Question): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not configured.");
    }

    const { question: questionText, options, correct_answer_index } = question;
    const correctAnswer = options[correct_answer_index];

    const prompt = `Act as an Expert Subject Tutor for competitive exams (UPSC/PSC).
    
    Question: "${questionText}"
    Correct Answer: "${correctAnswer}"

    Provide a comprehensive explanation following this strict structure:

    **Correct Answer:**
    [State the correct option text clearly.]

    **Detailed Explanation:**
    [Provide a thorough analysis of the answer. Break down complex logic. If there is a chronology, causes, or scientific principle, explain it in depth.]

    **Core Concept:**
    [Provide a specific sub-explanation about the central theme, rule, or term used in the question.
    - If Polity: Cite Articles/Acts.
    - If History: Mention timeline/impact.
    - If Science: Explain the law/formula.
    - Ensure this section provides multi-dimensional analysis.]

    Formatting Rules:
    - Use **Bold** ONLY for the three section headers exactly as written above.
    - Use double newlines (\\n\\n) to separate the sections.
    - Use LaTeX syntax for any mathematical formulas (e.g. $E=mc^2$).
    - Do NOT include a separate "Distractor Analysis" section.
    - Maintain a professional, academic tone.`;

    try {
        const response = await ai.models.generateContent({
            model: reasoningModel,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 2048 },
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting explanation with AI:", error);
        throw new Error("Failed to get explanation from AI.");
    }
};

export const solveQuestionWithAi = async (questionText: string, options: string[]): Promise<{ correct_answer_index: number, explanation: string }> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not configured.");
    }

    const prompt = `Act as an Expert Exam Solver.
    
    Question: "${questionText}"
    Options: ${JSON.stringify(options)}

    Task:
    1. Identify the correct answer index (0-3).
    2. Provide a detailed explanation in the standard format.

    Formatting Rules:
    - **Correct Answer:** [Text]
    - **Detailed Explanation:** [Deep analysis]
    - **Core Concept:** [Key takeaway]
    `;

    try {
        const response = await ai.models.generateContent({
            model: reasoningModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 2048 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        correct_answer_index: { type: Type.INTEGER },
                        explanation: { type: Type.STRING }
                    },
                    required: ["correct_answer_index", "explanation"]
                }
            }
        });
        
        const result = JSON.parse(response.text);
        return result;
    } catch (error) {
        console.error("Error solving question with AI:", error);
        throw new Error("Failed to solve question.");
    }
};

export const getQuizFeedbackWithAi = async (incorrectAnswers: IncorrectAnswer[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not configured.");
    }
    
    if (incorrectAnswers.length === 0) {
        return "Excellent work! You answered every question correctly. Keep up the great momentum!";
    }

    const mistakesText = incorrectAnswers.map(q => 
        `Question: "${q.question}"\n` +
        `Your Answer: "${q.options[q.user_answer_index]}"\n` +
        `Correct Answer: "${q.options[q.correct_answer_index]}"`
    ).join('\n\n');

    const prompt = `As an expert PSC exam tutor, a student has just completed a quiz. Here are the questions they answered incorrectly:\n\n${mistakesText}\n\nBased on these specific mistakes, please provide constructive feedback. Your feedback should:\n1. Start with an encouraging sentence.\n2. Identify the main topics or types of questions the student struggled with.\n3. Provide a brief, high-level tip or a key concept to remember.\n4. Use LaTeX for any math formulas.\n\nKeep the entire feedback concise (under 100 words) and use simple markdown (**bold**).`;

    try {
        const response = await ai.models.generateContent({
            model: fastModel, // Use Flash 2.5 for faster feedback response
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error getting quiz feedback with AI:", error);
        throw new Error("Failed to get feedback from AI.");
    }
};

export const extractRawQuestionsFromText = async (
    input: string | { data: string, mimeType: string },
    count: number = 100
): Promise<{ question: string, options: string[] }[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not configured.");
    }

    // Helper function to process a single chunk
    const processChunk = async (contentPart: any, chunkIndex: number): Promise<any[]> => {
        const promptText = `
        TASK: Extract Multiple Choice Questions.
        
        - Extract ALL MCQs found in this chunk.
        - Do NOT solve them.
        - Set correct_answer_index to -1.
        - Ensure exactly 4 options.
        - Output strict JSON array.
        `;

        const contentsPayload = {
            parts: [
                contentPart,
                { text: promptText }
            ]
        };

        try {
            const response = await ai.models.generateContent({
                model: fastModel, // Use Flash model for extraction to save tokens and speed
                contents: contentsPayload,
                config: {
                    responseMimeType: "application/json",
                    // Note: thinkingConfig REMOVED to maximize output token capacity for JSON
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { 
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING } 
                                }
                            },
                            required: ["question", "options"]
                        }
                    }
                }
            });

            return JSON.parse(response.text);
        } catch (error) {
            console.error(`Error processing chunk ${chunkIndex}:`, error);
            return [];
        }
    };

    try {
        let allQuestions: any[] = [];

        if (typeof input === 'string') {
            // --- TEXT CHUNKING STRATEGY ---
            // Split huge text into chunks of ~20,000 characters to bypass output token limits
            const CHUNK_SIZE = 20000; 
            const OVERLAP = 1000; // Overlap to ensure questions cut in half are caught in one of the chunks
            
            const chunks: string[] = [];
            for (let i = 0; i < input.length; i += (CHUNK_SIZE - OVERLAP)) {
                chunks.push(input.substring(i, i + CHUNK_SIZE));
            }

            console.log(`Split text into ${chunks.length} chunks for processing.`);

            // Process chunks in parallel (careful with rate limits, but Flash is high throughput)
            const promises = chunks.map((chunk, index) => 
                processChunk({ text: `Analyze this text segment (Part ${index + 1}): "${chunk}"` }, index)
            );

            const results = await Promise.all(promises);
            allQuestions = results.flat();

        } else {
            // --- PDF/IMAGE HANDLING ---
            // We can't easily chunk binary PDF on client. 
            // We rely on the Flash model's efficiency. 
            // If the PDF is huge (>50 questions), user should use Text mode.
            const result = await processChunk({ inlineData: input }, 0);
            allQuestions = result;
        }
        
        // --- DEDUPLICATION ---
        // Because of chunk overlap, we might have duplicates. Filter them out.
        const uniqueQuestions = new Map();
        allQuestions.forEach((q: any) => {
            if (!q.question || !Array.isArray(q.options)) return;
            
            // Normalize string to catch duplicates
            const key = q.question.trim().toLowerCase().substring(0, 100); 
            if (!uniqueQuestions.has(key)) {
                uniqueQuestions.set(key, {
                    question: q.question,
                    options: q.options.length === 4 ? q.options : [...q.options, "Option C", "Option D"].slice(0, 4)
                });
            }
        });

        const finalQuestions = Array.from(uniqueQuestions.values());

        if (finalQuestions.length === 0) {
             throw new Error("AI output format invalid or empty");
        }

        return finalQuestions;

    } catch (error) {
        console.error("Error extracting questions:", error);
        throw new Error("Failed to extract questions. For large files (>50 questions), try copying the text into 'Paste Text' mode.");
    }
};

/**
 * Generates MCQs and Study Notes from provided text or PDF content.
 * @param input Either a raw text string OR an object { data: base64String, mimeType: string } for files.
 * @param level Question Level (e.g., DEGREE, TOPIC)
 * @param examName Name of the exam or topic
 * @param codePrefix Prefix for question codes
 * @param subtopic Subtopic category
 * @param specificTopic Specific context string
 * @param count Number of questions to generate
 */
export const generateMcqsFromText = async (
  input: string | { data: string, mimeType: string },
  level: QuestionLevel,
  examName: string,
  codePrefix: string,
  subtopic: string,
  specificTopic?: string,
  count: number = 50
): Promise<{ questions: Omit<Question, 'id' | 'created_at'>[], studyNotes: string, detectedTopic: string }> => {
  if (!process.env.API_KEY) {
      throw new Error("API key not configured.");
  }

  const subtopicList = SUBTOPIC_SUGGESTIONS.join(', ');

  const subtopicInstruction = subtopic 
      ? `Set the "subtopic" field to "${subtopic}" for all questions.`
      : `Analyze the question text and options to strictly categorize the "subtopic" into one of these: [${subtopicList}]. If none match perfectly, use 'General'.`;

  const specificFocus = specificTopic 
    ? `Focus strictly on the specific topic: "${specificTopic}".` 
    : `Detect the main topic or theme from the content and include it in the output as "detected_topic".`;
  
  // Construct the prompt content parts based on input type
  let promptParts: any[] = [];
  let sourceDescription = "Source Text";

  if (typeof input === 'string') {
      promptParts = [
          `Analyze the provided source text deeply. ${specificFocus} Perform two tasks:`,
          `Source Text: "${input.substring(0, 100000)}"`
      ];
  } else {
      // It is a file (PDF)
      sourceDescription = "Uploaded Document";
      promptParts = [
          { inlineData: input }, // Pass file data directly
          { text: `Analyze the uploaded document deeply. ${specificFocus} Perform two tasks:` }
      ];
  }

  const instructionText = `
  TASK 1: Generate High-Yield Study Notes
  Create a comprehensive "Topic Study Section" summarizing the material. 
  - Format this as Markdown string (using # Headings, - Bullet points, **Bold** terms).
  - Include: Key Facts, Important Dates/Chronology, Definitions of Core Concepts, and any Formulas/Rules.
  - This should serve as a revision sheet for the student.

  TASK 2: Generate ${count} Multiple-Choice Questions (MCQs)
  Extract/Generate questions relevant for a PSC/UPSC exam (Level: ${level}).
  
  Note: Generate diverse and unique questions that cover different aspects of the content. Avoid simple repetitive questions.

  Requirements for JSON Output:
  1. Output a JSON object with properties: "questions" (array), "study_notes" (string), and "detected_topic" (string).
  2. Each question object must have:
     - "question": The question text. Use \\n characters to preserve visual structure for "Match the Following" or statement-based questions.
     - "options": An array of exactly 4 distinct string options.
     - "correct_answer_index": An integer (0-3).
     - "explanation": An expert UPSC-standard explanation with 3 sections separated by double newlines: **Correct Answer:**, **Detailed Explanation:** (comprehensive analysis), and **Core Concept:** (in-depth sub-explanation of the theme).
     - "subtopic": ${subtopicInstruction}
     - "level": "${level}"
     - "code": "${codePrefix}-{number}" (Generate sequential codes starting from ${codePrefix}-001)
     - "name": "${examName}"
  
  3. Use LaTeX syntax for any mathematical expressions (e.g., $x^2$).
  4. Provide as many valid questions as found in the ${sourceDescription}, up to ${count}.`;

  // Combine instructions into the final content payload
  let contentsPayload: any;
  if (typeof input === 'string') {
      // Just text prompt
      contentsPayload = promptParts.join('\n\n') + '\n' + instructionText;
  } else {
      // File + Text Instruction
      contentsPayload = {
          parts: [
              ...promptParts, 
              { text: instructionText }
          ]
      };
  }

  try {
      const response = await ai.models.generateContent({
          model: reasoningModel,
          contents: contentsPayload,
          config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 4096 }
          }
      });

      const responseText = response.text;
      let parsedData;
      try {
          parsedData = JSON.parse(responseText);
      } catch (e) {
          console.error("Failed to parse AI response as JSON:", responseText);
          throw new Error("AI response was not valid JSON.");
      }

      let questionsArray = [];
      let notes = "";
      let detectedTopic = specificTopic || "General Knowledge";

      if (parsedData.questions && Array.isArray(parsedData.questions)) {
          questionsArray = parsedData.questions;
          notes = parsedData.study_notes || "No study notes generated.";
          if (parsedData.detected_topic) {
              detectedTopic = parsedData.detected_topic;
          }
      } else if (Array.isArray(parsedData)) {
          // Fallback if AI forgets the wrapper
          questionsArray = parsedData;
          notes = "Study notes were not returned in the correct format.";
      } else {
          throw new Error("AI response did not contain a valid questions array.");
      }

      // Post-process to ensure types
      const processedQuestions = questionsArray.map((q: any) => ({
          level: level,
          name: examName,
          code: q.code || `${codePrefix}-000`,
          subtopic: subtopic || q.subtopic || 'General',
          question: q.question,
          options: q.options,
          correct_answer_index: typeof q.correct_answer_index === 'string' ? parseInt(q.correct_answer_index, 10) : q.correct_answer_index,
          explanation: q.explanation
      }));

      return {
          questions: processedQuestions,
          studyNotes: notes,
          detectedTopic: detectedTopic
      };

  } catch (error) {
      console.error("Error generating MCQs from text:", error);
      throw new Error("Failed to generate questions. Ensure the file contains readable text.");
  }
};
