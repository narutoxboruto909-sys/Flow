from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import json
import os
from datetime import datetime
import sys
import threading

# Add the AI assistant to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this for production
CORS(app)

# Import your AI class
try:
    from ai_assistant_fixed import LearningAI
    ai = LearningAI(name="WebAI")
    print("✅ AI loaded successfully")
except ImportError:
    # Fallback if the AI file doesn't exist
    class SimpleAI:
        def __init__(self):
            self.name = "WebAI"
            self.knowledge_file = "ai_knowledge.json"
        
        def generate_response(self, message):
            return f"Hi! I'm {self.name}. The full AI is not loaded. Please check ai_assistant_fixed.py"
    
    ai = SimpleAI()
    print("⚠️ Using fallback AI")

# Store chat histories (in production, use a database)
chat_sessions = {}

@app.route('/')
def home():
    """Render the main page"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.json
        message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Initialize or get session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = {
                'messages': [],
                'created_at': datetime.now().isoformat()
            }
        
        # Generate AI response
        response = ai.generate_response(message)
        
        # Add to session history
        timestamp = datetime.now().isoformat()
        chat_sessions[session_id]['messages'].append({
            'type': 'user',
            'content': message,
            'time': timestamp
        })
        
        chat_sessions[session_id]['messages'].append({
            'type': 'ai',
            'content': response,
            'time': timestamp
        })
        
        # Keep only last 50 messages per session
        if len(chat_sessions[session_id]['messages']) > 50:
            chat_sessions[session_id]['messages'] = chat_sessions[session_id]['messages'][-50:]
        
        return jsonify({
            'response': response,
            'session_id': session_id,
            'timestamp': timestamp,
            'ai_name': ai.name
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/session/new', methods=['POST'])
def new_session():
    """Create a new chat session"""
    session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.urandom(4).hex()}"
    chat_sessions[session_id] = {
        'messages': [],
        'created_at': datetime.now().isoformat()
    }
    return jsonify({'session_id': session_id})

@app.route('/session/<session_id>/history', methods=['GET'])
def get_history(session_id):
    """Get chat history for a session"""
    if session_id in chat_sessions:
        return jsonify(chat_sessions[session_id])
    return jsonify({'messages': []})

@app.route('/ai/learn', methods=['POST'])
def learn():
    """Manually teach the AI something"""
    try:
        data = request.json
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()
        
        if not question or not answer:
            return jsonify({'error': 'Both question and answer are required'}), 400
        
        # Use the AI's learning method
        if hasattr(ai, 'learn_new_answer'):
            ai.learn_new_answer(question, answer)
            return jsonify({'success': True, 'message': 'AI learned successfully!'})
        else:
            return jsonify({'error': 'AI does not support learning'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ai/stats', methods=['GET'])
def get_stats():
    """Get AI statistics"""
    try:
        if hasattr(ai, 'show_stats'):
            # Get stats from AI
            learned_count = len([k for k in ai.knowledge_base.keys() 
                               if k.startswith('learned_') or ai.knowledge_base[k].get('type') == 'learned'])
            
            return jsonify({
                'name': ai.name,
                'learned_questions': learned_count,
                'total_knowledge': len(ai.knowledge_base),
                'knowledge_file': ai.knowledge_file,
                'file_exists': os.path.exists(ai.knowledge_file)
            })
        else:
            return jsonify({'name': ai.name, 'message': 'Stats not available'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ai/commands', methods=['GET'])
def get_commands():
    """Get available commands"""
    commands = {
        'chat': 'Send a message to the AI',
        'new_session': 'Start a new conversation',
        'learn': 'Teach the AI something new',
        'stats': 'Get AI statistics',
        'history': 'Get conversation history'
    }
    return jsonify(commands)

if __name__ == '__main__':
    print("🚀 Starting AI Web Interface...")
    print("🌐 Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)