# Physica AI — FAQ

## General

**Q: What is Physica AI?**
A: An AI-powered research platform for physics researchers to discover, understand, and analyze scientific literature.

**Q: Who is Jessie?**
A: Jessie is the name of the AI assistant that powers the research chat experience.

**Q: Is there a backend server?**
A: No. Everything runs client-side. Data is stored in `localStorage`.

## Usage

**Q: How do I start a chat?**
A: Navigate to the chat page and type your question in the composer input.

**Q: Can I upload PDFs?**
A: Yes. Attach PDFs via the file picker or paste. They are processed through the File API.

**Q: Where are my conversations saved?**
A: In your browser's `localStorage`. Clearing browser data will delete them.

**Q: How do I select text from AI responses?**
A: Select any text in an AI message. A floating "Ask AI" toolbar appears. Click it to tag the selection and send it with your next message.

## Technical

**Q: What AI model does Physica AI use?**
A: Jessie, accessed via our server streaming endpoint.

**Q: What data is sent to the API?**
A: Your messages, relevant memories, and system instructions. No PII or tracking data.

**Q: Is my API key safe?**
A: Yes. It's stored in a gitignored `.env` file and never committed.
