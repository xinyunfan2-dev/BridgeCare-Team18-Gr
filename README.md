# BridgeCare — AI Agent for Social Welfare Assistance

BridgeCare is an AI-powered assistant designed to help Hong Kong residents better understand and access social welfare services.

By allowing users to describe their situations through natural language conversations, BridgeCare analyzes user needs, recommends suitable welfare programs, provides document preparation guidance, generates pre-filled application documents, and supports the overall application journey.

The end-to-end assistance workflow allows users to start with simple descriptions of their situations and receive completed document packages, including generated forms and supporting files required for welfare applications.


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

- React 18 — frontend framework for building interactive user interfaces
- TypeScript — type-safe frontend development
- Vite — development environment and build tool
- Tailwind CSS — utility-based styling framework
- shadcn/ui — reusable UI component library

### Backend & Infrastructure

- Supabase Edge Functions — serverless backend functions for securely handling API requests and connecting external services

### AI Services

- DeepSeek API — conversational AI and natural language understanding
- Exa Search API — information retrieval for welfare-related resources

### Document Processing

- LaTeX-based templates — structured welfare form generation
- jsPDF — PDF generation and processing
- JSZip — document packaging into downloadable archives

### Deployment

- Vercel — application hosting and deployment
- Spaceship — custom domain registration and management


