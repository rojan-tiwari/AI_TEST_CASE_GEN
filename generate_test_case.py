import os
import requests
from dotenv import load_dotenv


def load_prompt():
    with open("prompt/prompt.txt" , "r") as file:
     return file.read()
    
def load_automation_prompt():
    with open("prompt/automationPrompt.txt" , "r") as file:
     return file.read()
        

def generate_test_case(requirement: str,test_type: str) -> str:
 
    """
    Generate test case using the mistralai/Mistral-7B-v0.3 model.
    """


    print(f"Generating test case for: '{requirement}' with test type '{test_type}'")

    # Hugging Face token must be set as an environment variable
    load_dotenv()

    hf_token = os.environ.get("HUGGINGFACE_TOKEN")

    # hf_token = os.environ.get("HUGGINGFACEHUB_API_TOKEN")
    if not hf_token:
        raise ValueError("HUGGINGFACEHUB_API_TOKEN environment variable is not set")
    
    prompt_template = load_prompt()

    prompt = prompt_template.replace("{requirement}", requirement)
    prompt = prompt.replace("{test_type}", test_type)

    paylaod = {
       "inputs": prompt,
       "parameters": {
          "max_new_tokens": 1000,
          "temperature": 0.5,
          "top_p": 0.9
       }
    }

    response = requests.post(
       f"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
       headers={"Authorization": f"Bearer {hf_token}"},
       json=paylaod
    )
    
    response_json = response.json()
    print("Response from model",response_json)

    if isinstance(response_json,list):
       generated_text = response_json[0].get('generated_text','No text generated')
    elif isinstance(response_json,dict):
       generated_text = response_json.get('generated_text','No text generated')
    else:
       generated_text = 'unexpected format'


    print("generated test cases",generated_text)   

    return generated_text


def generate_automation_script(progLanguage,combined_test_cases: str) -> str:


    prompt_template = load_automation_prompt()
    prompt = prompt_template.replace("{test_cases}", combined_test_cases)
    prompt = prompt.replace("{progLanguage}", progLanguage)

    hf_token = os.environ.get("HUGGINGFACE_TOKEN")
    if not hf_token:
        raise ValueError("HUGGINGFACEHUB_API_TOKEN environment variable is not set")

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 1000,
            "temperature": 0.5,
            "top_p": 0.9
        }
    }

    response = requests.post(
        f"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        headers={"Authorization": f"Bearer {hf_token}"},
        json=payload
    )


    print(response)
    response_json = response.json()
    if isinstance(response_json, list):
        generated_text = response_json[0].get('generated_text', 'No script generated')
    elif isinstance(response_json, dict):
        generated_text = response_json.get('generated_text', 'No script generated')
    else:
        generated_text = 'Unexpected format'

    print("Generated automation script:\n", generated_text)
    return generated_text


if __name__ == "__main__":
    requirement = input("Enter the user story or requirement:\n")

    print("\nGenerating test cases...\n")
    test_cases = generate_test_case(requirement,test_type="")
    
