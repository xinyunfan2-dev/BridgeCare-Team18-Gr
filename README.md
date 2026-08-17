# BridgeCare — AI Agent for Social Welfare Assistance

> Top 8 Finalist, GDGoC Hackathon 2026 — Build with Agentic AI



BridgeCare is an AI-powered assistant designed to help Hong Kong residents better understand and access social welfare services.

By allowing users to describe their situations through natural language conversations, BridgeCare analyzes user needs, recommends suitable welfare programs, provides document preparation guidance, generates pre-filled application documents, and supports the overall application journey.

BridgeCare provides an end-to-end assistance workflow, allowing users to start from simple descriptions of their situations and receive guidance through welfare program discovery, document preparation, and application tracking.


## Problem

Although the Hong Kong government provides various welfare programs to support vulnerable groups, many people still face difficulties accessing these resources.

The challenge is not only the availability of welfare services, but also the complexity of understanding eligibility requirements and completing application procedures. Information is often distributed across different sources, and users may struggle to identify suitable programs or prepare the required documents.

While modern AI tools can provide users with information and general guidance, they often stop at answering questions. Many users still lack end-to-end assistance to complete complicated real-world procedures.

BridgeCare aims to bridge this gap by transforming welfare assistance from information searching into a guided application workflow.


## Solution

BridgeCare transforms the traditional welfare application process from information searching into an end-to-end guided workflow.

Instead of only providing information, the AI agent assists users throughout the application journey, including welfare program identification, information collection, document preparation, and application progress tracking.

### Intelligent Welfare Guidance

Users can describe their personal situations through natural language conversations. The AI agent analyzes user needs and recommends potentially suitable welfare programs based on the collected information.

### Document Preparation Assistance

The agent guides users through the required information collection process and generates pre-filled application documents, reducing the complexity of manual form preparation.

### Resource Information Retrieval

BridgeCare integrates external search capabilities to retrieve relevant welfare-related information and provide users with supporting resources.

### Application Journey Tracking

The system provides a journey dashboard that helps users organize application steps, monitor progress, and manage their welfare application workflow.


## System Architecture

BridgeCare follows an AI-agent architecture that integrates conversational interaction, information retrieval, document generation, and workflow management.

<img width="564" height="680" alt="image" src="https://github.com/user-attachments/assets/e4236ef4-d8aa-4e42-86e2-d77a4a50f411" />

### Frontend Layer

The React-based frontend provides the user interface for conversational interaction, dynamic information collection, document preparation, and application progress tracking. It manages user interactions through components such as chat interfaces, dynamic forms, welfare information cards, and journey dashboards.

### AI Agent Layer

The AI agent serves as the reasoning component of the system. It interprets user inputs through natural language interaction, identifies user needs, and generates responses based on retrieved information and collected user data.

### Information Retrieval Layer

BridgeCare integrates Exa Search API to retrieve relevant welfare-related information and provide users with supporting resources.

### Document Generation Layer

The system generates pre-filled application documents using structured templates and packages required files into downloadable archives. LaTeX-based document generation is used to produce formatted application forms for welfare submissions.

### Workflow Management Layer

The application journey module manages user progress, tracks completed steps, and organizes the welfare application workflow.


## Key Features

### Conversational Welfare Assistance

Users can describe their personal situations through natural language conversations. The AI agent collects relevant information, understands user needs, and guides users through the welfare application process.

### Welfare Program Recommendation

Based on user-provided information, BridgeCare identifies potentially suitable welfare programs and provides relevant resources to help users understand available assistance options.

### Document Preparation and Generation

BridgeCare assists users in preparing required application documents by collecting necessary information and generating pre-filled forms. The system packages generated documents into downloadable archives to simplify the submission process.

### Application Journey Tracking

The journey dashboard helps users organize application steps, monitor progress, and keep track of their welfare application workflow.


## Tech Stack

### Frontend

- React 18 
- TypeScript
- Vite 
- Tailwind CSS 
- shadcn/ui 

### Backend & Infrastructure

- Supabase Edge Functions 

### AI Services

- DeepSeek API
- Exa Search API 

### Document Processing

- LaTeX-based templates 
- jsPDF 
- JSZip 

### Deployment

- Vercel
- Spaceship

## My Contribution

As the team leader of the Top 8 finalist project in GDGoC Hackathon 2026 — Build with Agentic AI, I led the product design and AI workflow development of BridgeCare.

My responsibilities included:

- Designed the overall product concept and end-to-end welfare assistance workflow, including the five-step user journey from discovery to application tracking.
- Designed the AI agent interaction logic, including information collection, welfare recommendation, document preparation, and workflow transitions.
- Refined prompts and tested AI behaviors to improve the usability and reliability of the prototype.
- Coordinated team development and collaborated with my teammate to deliver the final project presentation.
  

## Limitations & Future Improvements

### Reliable Welfare Information Sources

The current prototype relies on external search services for welfare-related information retrieval. Future improvements include integrating verified government data sources or official APIs to improve information reliability and reduce misinformation risks.

### AI Accuracy and Evaluation

As the system relies on large language models for user interaction and recommendation, further evaluation is required to improve response reliability. Future work could explore stronger retrieval-augmented generation pipelines and systematic evaluation methods.

### User Testing and Accessibility

The current prototype has not yet been extensively tested with real welfare applicants. Future development could involve user studies with target communities to improve accessibility and usability.

### Privacy and Security

Welfare applications may involve sensitive personal information. Future improvements should focus on stronger privacy protection, secure data handling, and compliance with relevant data protection requirements.

### Offline Application Support

Currently, BridgeCare mainly focuses on digital assistance and document preparation. Future extensions could integrate service location information, appointment availability checking, and additional offline procedure support.

### AI Evaluation

The current prototype focuses on functional validation rather than large-scale evaluation. Future work could introduce benchmark datasets and systematic evaluation metrics to measure recommendation accuracy and response quality.

