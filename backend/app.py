from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import openai
import os
import json
import re
from config import SQLALCHEMY_DATABASE_URI, OPENAI_API_KEY
from models import Message, Session, db, User, OutreachSequence

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Initialize OpenAI Client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Route to check if the API is running
@app.route('/')
def home():
    return jsonify({"message": "Helix Backend is running!"})

# API Endpoint to generate AI outreach sequences
@app.route('/generate_sequence', methods=['POST'])
def generate_sequence():
    data = request.json
    user_prompt = data.get("message", "")

    if not user_prompt:
        return jsonify({"error": "No input provided"}), 400

    # Enhance the prompt to get structured output
    enhanced_prompt = f"""
    Create a structured outreach sequence based on the following request: "{user_prompt}"
    
    The sequence should have 3 steps and include a title.
    
    For each step, include:
    - What content to include in the outreach
    - What strategy this step fulfills
    
    Format your response as a JSON object with this structure:
    {{
      "title": "Title of the sequence",
      "steps": [
        {{
          "Step 1": {{
            "Content": "Content for step 1",
            "Strategy": "Strategy for step 1"
          }}
        }},
        {{
          "Step 2": {{
            "Content": "Content for step 2",
            "Strategy": "Strategy for step 2"
          }}
        }},
        {{
          "Step 3": {{
            "Content": "Content for step 3",
            "Strategy": "Strategy for step 3"
          }}
        }}
      ]
    }}
    
    Make sure the output is valid JSON.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": enhanced_prompt}]
        )
        ai_response = response.choices[0].message.content

        # Try to extract JSON from the response
        try:
            # Find JSON object in response using regex (handles cases where there might be extra text)
            json_match = re.search(r'({[\s\S]*})', ai_response)
            if json_match:
                json_str = json_match.group(1)
                parsed_json = json.loads(json_str)
                return jsonify({"response": ai_response, "json": parsed_json})
            else:
                return jsonify({"response": ai_response})
        except json.JSONDecodeError:
            return jsonify({"response": ai_response})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint to store generated sequences in PostgreSQL
@app.route('/save_sequence', methods=['POST'])
def save_sequence():
    data = request.json
    print("Received Data:", data)  # Log incoming request data

    user_id = data.get("user_id")
    sequence_text = data.get("sequence_text")

    if not user_id or not sequence_text:
        print("Error: Missing data")  # Log missing data
        return jsonify({"error": "Missing data"}), 400

    try:
        new_sequence = OutreachSequence(user_id=user_id, sequence_text=sequence_text)
        db.session.add(new_sequence)
        db.session.commit()
        print("Sequence saved successfully!")  # Log success
        return jsonify({"message": "Sequence saved successfully!"})
    except Exception as e:
        print("Database Error:", str(e))  # Log any database errors
        return jsonify({"error": str(e)}), 500

# API Endpoint to get saved sequences
@app.route('/get_sequences/<int:user_id>', methods=['GET'])
def get_sequences(user_id):
    sequences = OutreachSequence.query.filter_by(user_id=user_id).all()
    return jsonify([{"id": seq.id, "text": seq.sequence_text} for seq in sequences])
# Add to your app.py
@app.route('/api/chat/history/<int:session_id>', methods=['GET'])
def get_chat_history(session_id):
    try:
        # Assuming you have a Message model
        messages = Message.query.filter_by(session_id=session_id).order_by(Message.created_at.asc()).all()
        return jsonify([
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat()
            } for message in messages
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
def add_message():
    data = request.json
    session_id = data.get('session_id')
    role = data.get('role')
    content = data.get('content')
    
    if not all([session_id, role, content]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        message = Message(session_id=session_id, role=role, content=content)
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at.isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Add to your app.py
@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    try:
        sessions = Session.query.filter_by(user_id=user_id).order_by(Session.created_at.desc()).all()
        return jsonify([
            {
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat()
            } for session in sessions
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.json
    user_id = data.get('user_id')
    title = data.get('title', 'New Session')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    try:
        session = Session(user_id=user_id, title=title)
        db.session.add(session)
        db.session.commit()
        
        # Add initial message
        welcome_message = Message(
            session_id=session.id, 
            role='assistant', 
            content="Hi! I'm Helix, your recruiting assistant. How can I help you create an outreach sequence today?"
        )
        db.session.add(welcome_message)
        db.session.commit()
        
        return jsonify({
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Create tables when the app starts
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)