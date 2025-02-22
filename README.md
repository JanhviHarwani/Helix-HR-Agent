# Helix-HR-Agent
Full stack app with AI Agent

frontend: React
backend Flask
db: postgreSQL/pinecone


The flow works like this:

- User sends a message from the frontend
- Backend receives it and passes it to the agentic layer
- Agentic layer (LangChain) formats the prompt, manages context, and calls the LLM
- LLM generates a response
- The agent processes the response (extracting information, etc.)
- Information is stored in the database as needed
- Response is sent back to the frontend


backend/
│── app.py               # Main Flask application
│── models.py            # Database models (User & OutreachSequence)
│── config.py            # Configuration settings
│── requirements.txt     # Dependencies
│── migrations/          # Database migration folder
│── venv/                # Virtual environment (optional)

# start frontend:
cd frontend
npm start

# start backend:
cd backend
source venv/bin/activate
python app.py

# start postgreSQL: 
psql -U helix_user -d helix_recruiter

tasks remaining:
- save changes in sequences don’t really do patch api
- make UI better
- as soon as the sequence gets saved should show it under saved refresh issue
- saved sequence should be saved with the title
- Too many api calls in the first render

User Checklist:
[ ]  User should be able to chat ‘back and forth’ with the AI
[ ]  The AI should ask follow up questions as needed to identify sequence content, angle, # steps, etc
[ ]  After enough data is collected, the AI should ‘create a sequence’ (live) on the right workspace
[✅]  The user should be able to edit the sequence in the workspace on the right
[ ]  The user should be able to also request edits ‘directly to the AI’

Technical Checklist:
[✅]  Leverage a relational database for data store
[✅]  Use Flask for the backend and ensure backend is modular
[✅]  Use an agentic framework like Langchain, OpenAI Assistants, or Crew AI to build out the LLM portion.
[✅]  Ensure the frontend is modular and built in React + Typescript

Bonus:
[ ]  (agentic) Creative ways to use tools e.g., web browsing, LinkedIn sending, or unique architecture
[ ]  (agentic) Create a RAG memory so the agent remembers historical requests for future iterations
[ ]  (full stack + agentic architecture) Have a way to store ‘context’ about the user + their company during some sort of sign up flow so the AI doesn’t ask silly questions (ex. “Where do you work?”)
[✅]  (full stack) Have an ability to have multiple ‘sessions’ per user
[✅]  (full stack) Add more ‘tabs’ and functionality in the workspace
[ ]  (full stack) Add ‘streaming’ so the chat experience feels more ChatGPT-esque