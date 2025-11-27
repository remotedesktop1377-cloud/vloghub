import json
import os
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
genai.configure(api_key=api_key)

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio file and return complete text only.
    
    Args:
        audio_file_path: Path to audio file
        
    Returns:
        Complete transcription text as string
    """
    print(f'Transcribing audio file: {audio_file_path}')
    
    try:
        # Use Gemini 2.5 Flash for audio transcription
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # Read audio file
        audio_file = genai.upload_file(path=audio_file_path)
        
        # Create prompt for transcription - just get the text
        prompt = """Please transcribe this audio file completely. 
        Include all repeated words and sentences exactly as spoken, including duplicates.
        Return only the transcription text, nothing else."""
        
        # Generate transcription
        response = model.generate_content([prompt, audio_file])
        
        # Get the transcription text
        transcription_text = response.text.strip()
        
        # Clean up any markdown formatting if present
        if "```" in transcription_text:
            # Remove markdown code blocks
            lines = transcription_text.split('\n')
            transcription_text = '\n'.join([line for line in lines if not line.strip().startswith('```')])
            transcription_text = transcription_text.replace('```', '').strip()
        
        # Save the transcription to a file for reference
        transcription_file_path = str(Path(audio_file_path).with_suffix('.json'))
        transcription_data = {
            "text": transcription_text
        }
        
        with open(transcription_file_path, 'w', encoding='utf-8') as f:
            json.dump(transcription_data, f, ensure_ascii=False, indent=2)
        
        # Clean up uploaded file
        genai.delete_file(audio_file.name)
        
        # Return the text string
        return transcription_text
        
    except Exception as e:
        print(f'Error during transcription: {e}')
        raise

