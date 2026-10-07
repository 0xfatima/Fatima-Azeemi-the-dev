import { randomUUID } from "crypto";

const cover = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export function seedData() {
  const workspaceAlbumId = randomUUID();
  const travelAlbumId = randomUUID();

  return {
    projects: [
      {
        id: randomUUID(),
        title: "Scriptify",
        stack: ["Python", "Qwen", "ChromaDB", "CustomTkinter", "RAG"],
        description:
          "Offline, privacy-first AI writing assistant for researchers with local RAG, PDF/DOCX processing, spell and grammar checking, LaTeX support, and document Q&A powered by Qwen and ChromaDB.",
        live: "",
        github: "https://github.com/0xfatima/Scriptify",
        cover: "https://raw.githubusercontent.com/0xfatima/Scriptify/main/images/screenshot1.jpeg",
        gallery: [
          "https://raw.githubusercontent.com/0xfatima/Scriptify/main/images/screenshot1.jpeg",
          "https://raw.githubusercontent.com/0xfatima/Scriptify/main/images/screenshot2.jpeg",
        ],
      },
      {
        id: randomUUID(),
        title: "Fingerprint Quality Detector",
        stack: ["CNN", "SVM", "Next.js", "Hugging Face", "Vercel"],
        description:
          "Web application using CNN and SVM models to classify fingerprint image quality, with a Next.js frontend and Gradio/Hugging Face hosted inference.",
        live: "https://finger-print-quality-detector.vercel.app",
        github: "https://github.com/0xfatima/Finger-Print-Quality-Detector",
        cover: "https://raw.githubusercontent.com/0xfatima/Finger-Print-Quality-Detector/master/screenshots/homepage.png",
        gallery: [
          "https://raw.githubusercontent.com/0xfatima/Finger-Print-Quality-Detector/master/screenshots/homepage.png",
          "https://raw.githubusercontent.com/0xfatima/Finger-Print-Quality-Detector/master/screenshots/detector.png",
        ],
      },
      {
        id: randomUUID(),
        title: "Material Fusion",
        stack: ["Computer Vision", "Roboflow", "Next.js", "Firebase", "Clerk"],
        description:
          "Inventory management app with real-time camera classification via Roboflow, Firestore sync, Clerk auth, and a Groq-powered inventory assistant.",
        live: "https://material-fusion.vercel.app",
        github: "https://github.com/0xfatima/material-fusion",
        cover: "https://raw.githubusercontent.com/0xfatima/material-fusion/main/screenshots/landing-page.png",
        gallery: [
          "https://raw.githubusercontent.com/0xfatima/material-fusion/main/screenshots/landing-page.png",
          "https://raw.githubusercontent.com/0xfatima/material-fusion/main/screenshots/inventory.png",
          "https://raw.githubusercontent.com/0xfatima/material-fusion/main/screenshots/camera-classification.png",
        ],
      },
      {
        id: randomUUID(),
        title: "YouTube QA Chatbot",
        stack: ["LangChain", "ChromaDB", "Groq", "RAG"],
        description:
          "Chatbot that summarizes long YouTube transcripts and answers queries via an end-to-end RAG pipeline with transcript extraction, embeddings, and semantic search.",
        live: "",
        github: "",
        cover: cover("photo-1611162616475-46b635cb6868"),
        gallery: [cover("photo-1611162616475-46b635cb6868"), cover("photo-1516321318423-f06f85e504b3")],
      },
      {
        id: randomUUID(),
        title: "AWS SageMaker Model Fine-Tuning",
        stack: ["AWS SageMaker", "Llama 2", "Python", "LLMs"],
        description:
          "Fine-tuned Meta Llama 2 7B on a healthcare domain with Amazon SageMaker JumpStart, comparing base vs fine-tuned responses for quality and token efficiency.",
        live: "",
        github: "https://github.com/0xfatima/Fine-tuning-a-model-with-AWS",
        cover: "https://raw.githubusercontent.com/0xfatima/Fine-tuning-a-model-with-AWS/main/screenshots/finetuned-output.png",
        gallery: [
          "https://raw.githubusercontent.com/0xfatima/Fine-tuning-a-model-with-AWS/main/screenshots/sagemaker-setup.png",
          "https://raw.githubusercontent.com/0xfatima/Fine-tuning-a-model-with-AWS/main/screenshots/select-model.png",
          "https://raw.githubusercontent.com/0xfatima/Fine-tuning-a-model-with-AWS/main/screenshots/base-model-output.png",
          "https://raw.githubusercontent.com/0xfatima/Fine-tuning-a-model-with-AWS/main/screenshots/finetuned-output.png",
        ],
      },
      {
        id: randomUUID(),
        title: "AI Task Manager",
        stack: ["MongoDB", "Express", "React", "Node.js"],
        description:
          "Full-stack task tracking app with JWT authentication, task dashboard, overdue tracking, and image upload — built as a MERN productivity workflow.",
        live: "",
        github: "https://github.com/0xfatima/task-tracker",
        cover: "https://raw.githubusercontent.com/0xfatima/task-tracker/main/screenshots/dashboard.png",
        gallery: [
          "https://raw.githubusercontent.com/0xfatima/task-tracker/main/screenshots/dashboard.png",
          "https://raw.githubusercontent.com/0xfatima/task-tracker/main/screenshots/my-tasks.png",
          "https://raw.githubusercontent.com/0xfatima/task-tracker/main/screenshots/create-task.png",
          "https://raw.githubusercontent.com/0xfatima/task-tracker/main/screenshots/login.png",
        ],
      },
    ],
    skills: [
      { name: "Python", row: 1 },
      { name: "JavaScript", row: 1 },
      { name: "React.js", row: 1 },
      { name: "Next.js", row: 1 },
      { name: "FastAPI", row: 1 },
      { name: "Tailwind CSS", row: 1 },
      {
        name: "LangChain",
        row: 2,
        icon: "https://cdn.simpleicons.org/langchain/1C3C3C",
      },
      {
        name: "OpenAI",
        row: 2,
        icon: "https://cdn.simpleicons.org/openai/412991",
      },
      {
        name: "ChromaDB",
        row: 2,
        icon: "https://cdn.simpleicons.org/databricks/FF3621",
      },
      {
        name: "GCP",
        row: 2,
        icon: "https://cdn.simpleicons.org/googlecloud/4285F4",
      },
      {
        name: "Kubernetes",
        row: 2,
        icon: "https://cdn.simpleicons.org/kubernetes/326CE5",
      },
      {
        name: "MongoDB",
        row: 2,
        icon: "https://cdn.simpleicons.org/mongodb/47A248",
      },
      { name: "LLMs & RAG", row: 3 },
      { name: "NLP", row: 3 },
      { name: "Computer Vision", row: 3 },
      { name: "Prompt Engineering", row: 3 },
      { name: "Node.js", row: 3 },
      { name: "Git & GitLab", row: 3 },
    ].map((skill) => ({ id: randomUUID(), icon: "", ...skill })),
    experience: [
      {
        id: randomUUID(),
        title: "AI Intern",
        company: "Folio3",
        duration: "Oct 2025 — Nov 2025",
        type: "Internship",
        description:
          "Developed RAG pipelines with Python, LangChain, FAISS, and OpenAI embeddings for domain-specific product knowledge retrieval. Built an NLP tool to extract and rank high-performing product features from customer reviews using stemming, lemmatization, and text-processing techniques.",
        logo: "",
      },
      {
        id: randomUUID(),
        title: "Frontend Intern",
        company: "Metatalent.ai",
        duration: "Dec 2024 — Feb 2025",
        type: "Internship",
        description:
          "Developed frontend components with React.js, Next.js, and CSS in agile sprints using GitLab. Documented and tested 100+ UI components with Storybook, performed manual testing, and validated user flows to support developer onboarding.",
        logo: "",
      },
      {
        id: randomUUID(),
        title: "AI Fellow",
        company: "Headstarter AI",
        duration: "Summer 2024",
        type: "Fellowship",
        description:
          "Built and integrated AI-powered applications using generative AI, computer vision, and text-to-speech models. Implemented RAG-based systems, integrated LLMs into web apps, and deployed using modern web frameworks and cloud platforms.",
        logo: "",
      },
    ],
    education: [
      {
        id: randomUUID(),
        stepLabel: "Step 01 / Bachelor's",
        degree: "B.S. Computer Science (Specialization in Artificial Intelligence)",
        school: "NED University of Engineering and Technology",
        dates: "2022 — 2026",
        description:
          "CGPA: 3.74 / 4.0. Focused on artificial intelligence, machine learning, NLP, computer vision, and full-stack AI application development.",
        logo: "",
      },
    ],
    courses: [
      {
        id: randomUUID(),
        title: "Deep Learning Specialization",
        issuer: "Coursera / DeepLearning.AI",
        spec: "Deep Learning",
        link: "https://www.coursera.org",
        issuerLogo: "https://cdn.simpleicons.org/coursera/0056D2",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "Mathematics for Machine Learning",
        issuer: "Coursera",
        spec: "Machine Learning",
        link: "https://www.coursera.org",
        issuerLogo: "https://cdn.simpleicons.org/coursera/0056D2",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "TensorFlow Developer Certificate",
        issuer: "Coursera / TensorFlow",
        spec: "Deep Learning",
        link: "https://www.tensorflow.org/certificate",
        issuerLogo: "https://cdn.simpleicons.org/tensorflow/FF6F00",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "Associate AI Engineer for Developers",
        issuer: "DataCamp",
        spec: "AI Engineering",
        link: "https://www.datacamp.com",
        issuerLogo: "https://cdn.simpleicons.org/datacamp/03EF62",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "Introducing Generative AI with AWS",
        issuer: "Udacity",
        spec: "Generative AI",
        link: "https://www.udacity.com",
        issuerLogo: "https://cdn.simpleicons.org/udacity/02B3E4",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "Data Analytics",
        issuer: "IEC",
        spec: "Analytics",
        link: "",
        issuerLogo: "",
        certificate: "",
      },
      {
        id: randomUUID(),
        title: "AI Programming with Python Nanodegree",
        issuer: "Udacity",
        spec: "Scholarship",
        link: "https://www.udacity.com",
        issuerLogo: "https://cdn.simpleicons.org/udacity/02B3E4",
        certificate: "",
      },
    ],
    albums: [
      {
        id: workspaceAlbumId,
        title: "Workspace",
        description: "Desk setups and studio corners.",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: travelAlbumId,
        title: "Travel & Landscapes",
        description: "Field notes from trips and open horizons.",
        cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      },
    ],
    gallery: [
      {
        id: randomUUID(),
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        caption: "Workspace setup",
        albumId: workspaceAlbumId,
      },
      {
        id: randomUUID(),
        url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80",
        caption: "Photography trip",
        albumId: travelAlbumId,
      },
      {
        id: randomUUID(),
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
        caption: "Landscape focus",
        albumId: travelAlbumId,
      },
    ],
    publications: [],
  };
}
