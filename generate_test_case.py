import os
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def generate_test_case(requirement: str, test_type: str = None) -> str:
    """
    Generate test case using the VermaPankaj123/TestCaseGeneration-Mistral model.
    """

    print(f"Generating test case for: '{requirement}' with test_type='{test_type}'")

    # Hugging Face token must be set as an environment variable
    hf_token = os.environ.get("HUGGINGFACEHUB_API_TOKEN")
    if not hf_token:
        raise ValueError("HUGGINGFACEHUB_API_TOKEN environment variable is not set")

    model_id = "Pankaj/TestCaseGeneration-Mistral"

    tokenizer = AutoTokenizer.from_pretrained(model_id,token=hf_token)
    model = AutoModelForCausalLM.from_pretrained(model_id,token=hf_token)

    prompt = f"""
User Story:
{requirement}

Test Cases:
"""

    inputs = tokenizer(prompt, return_tensors="pt")

    outputs = model.generate(
        **inputs,
        max_new_tokens=300,
        temperature=0.7,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )

    # Decode output tokens to text
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return result


if __name__ == "__main__":
    requirement = input("Enter the user story or requirement:\n")
    test_type = input("Enter test type (optional): ").strip() or None

    print("\nGenerating test cases...\n")
    test_cases = generate_test_case(requirement, test_type)
    print(test_cases)
