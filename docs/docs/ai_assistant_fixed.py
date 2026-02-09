# Save this as ai_assistant_fixed.py
import json
import re
import random
import os
from datetime import datetime

class LearningAI:
    def __init__(self, name: str = "WebAI"):
        self.name = name
        self.knowledge_file = "ai_knowledge.json"
        self.knowledge_base = self._load_knowledge()
        
    def _load_knowledge(self):
        """Load or create knowledge base"""
        if os.path.exists(self.knowledge_file):
            try:
                with open(self.knowledge_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        # Default knowledge
        return {
            "greetings": {
                "patterns": ["hello", "hi", "hey"],
                "responses": [f"Hello! I'm {self.name}. How can I help you?"],
                "type": "builtin"
            },
            "farewell": {
                "patterns": ["bye", "goodbye"],
                "responses": ["Goodbye! Have a great day!"],
                "type": "builtin"
            },
            "capabilities": {
                "patterns": ["what can you do", "help"],
                "responses": ["I can answer questions, do math, tell time, and learn from you!"],
                "type": "builtin"
            },
            "time": {
                "patterns": ["time", "what time"],
                "responses": [],
                "type": "builtin"
            },
            "math": {
                "patterns": ["calculate", "add", "sum"],
                "responses": [],
                "type": "builtin"
            }
        }
    
    def _save_knowledge(self):
        """Save knowledge to file"""
        with open(self.knowledge_file, 'w', encoding='utf-8') as f:
            json.dump(self.knowledge_base, f, indent=2, ensure_ascii=False)
    
    def generate_response(self, message):
        """Generate response to user message"""
        message_lower = message.lower()
        
        # Check for built-in patterns
        for category, data in self.knowledge_base.items():
            for pattern in data.get("patterns", []):
                if pattern in message_lower:
                    if category == "time":
                        now = datetime.now()
                        return f"The current time is {now.strftime('%I:%M %p')}"
                    elif category == "math":
                        # Simple math
                        numbers = re.findall(r'\d+', message)
                        if numbers:
                            nums = [int(n) for n in numbers]
                            return f"The sum of {numbers} is {sum(nums)}"
                        return "I need numbers to calculate!"
                    elif data.get("responses"):
                        return random.choice(data["responses"])
        
        # Check for learned patterns
        for key in list(self.knowledge_base.keys()):
            if key.startswith("learned_"):
                for pattern in self.knowledge_base[key].get("patterns", []):
                    if pattern in message_lower:
                        return self.knowledge_base[key]["responses"][0]
        
        # If no match found, ask to learn
        return f"I don't know how to answer that. Can you teach me? What should I say when asked: '{message}'?"
    
    def learn_new_answer(self, question, answer):
        """Learn a new question and answer"""
        # Create a safe key
        safe_key = f"learned_{len([k for k in self.knowledge_base.keys() if k.startswith('learned_')]) + 1}"
        
        # Add to knowledge
        self.knowledge_base[safe_key] = {
            "patterns": [question.lower()],
            "responses": [answer],
            "type": "learned",
            "learned_on": datetime.now().isoformat()
        }
        
        # Save to file
        self._save_knowledge()