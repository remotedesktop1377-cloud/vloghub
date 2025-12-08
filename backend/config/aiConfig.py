import os


class GeminiConfig:
    def __init__(self):
        self.MODEL_FLASH = os.getenv("GEMINI_MODEL_FLASH", "gemini-2.5-flash")
        self.MODEL_PRO = os.getenv("GEMINI_MODEL_PRO", "gemini-2.5-pro")

class AIConfig:
    def __init__(self):
        self.GEMINI = GeminiConfig()


AI_CONFIG = AIConfig()

