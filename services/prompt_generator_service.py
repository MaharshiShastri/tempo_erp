from groq import Groq
import os

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

class PromptGeneratorService:

    MODEL = "openai/gpt-oss-20b"

    def __init__(self):
        self.groq_client = groq_client

    def generate_prompt(
        self,
        *,
        requirements: str,
        user_role: str,
        target_llm: str,
        prompt_type: str,
    ) -> str:

        prompt_kind = ("system prompt" if prompt_type == "system" else "normal user prompt")

        generator_prompt = f"""
You are an expert prompt engineer.

Create a highly specific {prompt_kind} for the target LLM.

USER ROLE:
{user_role}

TARGET LLM:
{target_llm}

PROMPT TYPE:
{prompt_kind}

USER REQUIREMENTS:
{requirements}

Your job is to transform the user's requirements into a
production-quality prompt.

Requirements:

1. Make the prompt highly specific to the user's professional role.
2. Preserve the user's actual intent.
3. Add useful context, constraints, assumptions, and output
   requirements where appropriate.
4. Do not invent company-specific facts that were not provided.
5. Make the prompt immediately usable by the target LLM.
6. Optimize the structure and wording for the selected target LLM.
7. If this is a system prompt, define the assistant's persona,
   responsibilities, behavior, constraints, and response style.
8. If this is a normal prompt, focus on the task, context,
   inputs, constraints, and expected output.
9. Do not explain your reasoning.
10. Do not wrap the answer in Markdown code fences.
11. Our company name is Tempo Instruments Pvt. Ltd., the prompt should clearly mention this
    & also ask the LLM to research the company before responding.
12. Return ONLY the final prompt.

FINAL OUTPUT:
Only the generated prompt.
"""

        response = self.groq_client.chat.completions.create(
            model=self.MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional prompt "
                        "engineering assistant. "
                        "Return only the requested prompt."
                    ),
                },
                {
                    "role": "user",
                    "content": generator_prompt,
                },
            ],
            temperature=0.2,
        )

        content = (
            response
            .choices[0]
            .message
            .content
        )

        if not content:
            raise ValueError(
                "Prompt generator returned an empty response."
            )

        return content.strip()