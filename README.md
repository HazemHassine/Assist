# Assist: Personal University Note Organizer & AI Helper

Assist is an attempt to create a personal assistant to help with organizing university notes and leveraging AI for assistance. It combines file management with a Retrieval Augmented Generation (RAG) pipeline to make your notes searchable and queryable.

Key Features:
*   **File Management**: Upload, browse, read, and organize your documents through a user-friendly web interface.
*   **RAG Pipeline**: Process your documents to extract text, create embeddings, and store them in a vector database.
*   **Question Answering**: Ask questions in natural language and get answers based on the information contained in your processed documents.

## Project Structure

The project is organized into the following main directories:

*   **`/frontend`**: Contains the Next.js web application that provides the user interface for file management.
*   **`/backend`**: Houses the FastAPI server that exposes an API for file operations (list, read, write, rename) within the `/vault` directory.
*   **`/notebooks`**: Includes Jupyter notebooks that implement the RAG pipeline. These notebooks are used for:
    *   Ingesting documents (PDFs, text files, Markdown).
    *   Chunking the text content.
    *   Generating embeddings using sentence transformer models.
    *   Storing and indexing these embeddings in a ChromaDB vector database.
    *   Providing a question-answering interface based on the processed documents.
*   **`/vault`**: This directory serves as the primary storage for user-uploaded documents and notes. The backend API interacts with this directory to manage files, and the RAG pipeline notebooks can be configured to process documents from here.
*   **`/data`**: (To be created by the user) This directory is expected by the document ingestion notebook (`notebooks/Document_Ingestion_Chunking.ipynb`) to contain the initial set of documents to be processed by the RAG pipeline.
*   **`/preprocessed`**: (Created by notebooks) This directory stores the JSON files containing the chunked text from the documents processed by `notebooks/Document_Ingestion_Chunking.ipynb`.
*   **`/chroma_db`**: (Created by notebooks) This directory contains the ChromaDB vector database where the document embeddings are stored by `notebooks/Embedding_documents.ipynb`.

## Setup and Running the Project

This project consists of three main components: a FastAPI backend, a Next.js frontend, and Jupyter notebooks for the RAG pipeline.

### Prerequisites

*   Python (version 3.8+ recommended)
*   Node.js and npm (or yarn/pnpm/bun) for the frontend
*   Access to a terminal or command prompt

### 1. Backend

The backend is a FastAPI application that serves the file management API.

*   **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
*   **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
*   **Install dependencies:**
    The backend requires `fastapi` and `uvicorn`. You can install them directly:
    ```bash
    pip install fastapi uvicorn
    ```
    It's also a good practice to have a `requirements.txt` specific to the backend. For now, these are the core dependencies.
*   **Run the backend server:**
    From within the `backend` directory:
    ```bash
    uvicorn files_api:app --reload
    ```
    The API will typically be available at `http://127.0.0.1:8000`.

### 2. Frontend

The frontend is a Next.js application.

*   **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
*   **Install dependencies:**
    (This assumes you have Node.js and npm installed)
    ```bash
    npm install
    # or yarn install / pnpm install / bun install
    ```
*   **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev / bun dev
    ```
    The frontend application will typically be available at `http://localhost:3000`.

### 3. Notebooks (RAG Pipeline)

The Jupyter notebooks are used to process your documents and enable the question-answering functionality.

*   **Navigate to the notebooks directory:**
    ```bash
    cd notebooks
    ```
*   **Create a virtual environment (recommended, if not already done for the backend and you want separation):**
    ```bash
    python -m venv venv_notebooks
    source venv_notebooks/bin/activate # On Windows: venv_notebooks\Scripts\activate
    ```
*   **Install dependencies:**
    The notebooks have a comprehensive list of dependencies. Install them using the provided `reqs.txt` file:
    ```bash
    pip install -r reqs.txt
    ```
    Key dependencies include `jupyter`, `nltk`, `transformers`, `sentence-transformers`, `chromadb`, `PyMuPDF`, and `langchain`.
*   **Prepare your data:**
    *   Create a directory named `data` inside the `notebooks` directory (i.e., `notebooks/data/`).
    *   Place the documents (PDFs, TXT, MD files) you want to process into this `data` directory.
*   **Run Jupyter Notebook or JupyterLab:**
    ```bash
    jupyter notebook
    # or
    jupyter lab
    ```
    Open the following notebooks in order:
    1.  **`Document_Ingestion_Chunking.ipynb`**:
        *   This notebook will read documents from the `notebooks/data` directory.
        *   It will extract text, chunk it, and save the processed chunks as JSON files into a new `notebooks/preprocessed` directory.
        *   Run all cells in this notebook.
    2.  **`Embedding_documents.ipynb`**:
        *   This notebook will take the JSON chunks from `notebooks/preprocessed`.
        *   It will generate embeddings for these chunks and store them in a ChromaDB vector database located at `notebooks/chroma_db`.
        *   It also demonstrates how to set up a retriever and a QA pipeline to answer questions.
        *   Run the cells, especially `ingest_all()` (or the equivalent cell that populates the ChromaDB collection) to process your documents. After ingestion, you can use the `answer(query)` function to ask questions.

## RAG Pipeline Explained

The core of the question-answering functionality lies in the Retrieval Augmented Generation (RAG) pipeline implemented in the Jupyter notebooks. Here's a breakdown of the process:

1.  **Document Ingestion (`Document_Ingestion_Chunking.ipynb`):**
    *   **Source**: Documents are loaded from the `notebooks/data` directory. Supported formats currently include PDF (`.pdf`), plain text (`.txt`), and Markdown (`.md`).
    *   **Text Extraction**: Text is extracted from these documents. For PDFs, `PyMuPDF` (fitz) is used.
    *   **Chunking**: The extracted text is then split into smaller, manageable chunks. This is crucial because language models have context limits, and processing smaller, focused chunks is more effective for retrieval. A tokenizer (e.g., from `transformers`) is used, and chunks are created with a defined maximum token length and overlap between chunks to maintain context.
    *   **Output**: The processed chunks for each document are saved as JSON files in the `notebooks/preprocessed` directory. Each JSON file typically contains the original file path and a list of its text chunks.

2.  **Embedding and Storage (`Embedding_documents.ipynb`):**
    *   **Loading Chunks**: The JSON files from the `preprocessed` directory are loaded.
    *   **Embedding Generation**: Each text chunk is converted into a numerical vector representation called an "embedding." This is done using a sentence transformer model (e.g., `all-MiniLM-L6-v2` from `sentence-transformers`). Embeddings capture the semantic meaning of the text, allowing for similarity searches.
    *   **Vector Database**: These embeddings, along with their corresponding text chunks and metadata (like the source file), are stored in a ChromaDB vector database. ChromaDB is a specialized database designed for efficient storage and retrieval of vector embeddings. The database is persisted in the `notebooks/chroma_db` directory.

3.  **Retrieval and Question Answering (`Embedding_documents.ipynb`):**
    *   **Query Embedding**: When you ask a question (query), it is also converted into an embedding using the same sentence transformer model.
    *   **Similarity Search**: The query embedding is then compared against all the embeddings stored in ChromaDB to find the text chunks that are most semantically similar to your question. This is the "Retrieval" part of RAG.
    *   **Context Augmentation**: The most relevant text chunks (the "context") retrieved from the database are then combined with your original question.
    *   **Answer Generation**: This combined prompt (question + retrieved context) is fed to a question-answering (QA) model (e.g., a DistilBERT model fine-tuned on SQuAD, accessed via `transformers` pipeline). The QA model then generates an answer based on the provided context. This is the "Generation" part of RAG.
    *   The `Embedding_documents.ipynb` notebook provides an `answer(query)` function that encapsulates this retrieval and QA process.

This pipeline allows the system to answer questions based on a large corpus of documents by first finding relevant information and then using a language model to formulate a precise answer.

## Backend API

The FastAPI backend (`/backend/files_api.py`) provides an API for the frontend to interact with documents stored in the `/vault` directory. It supports basic file operations such as listing, reading, writing, and renaming files, enabling the web interface to manage your notes.

## How to Use the Application

Here's a typical workflow for using Assist:

1.  **Start the Services**:
    *   Launch the backend FastAPI server (see [Backend Setup](#1-backend)).
    *   Launch the frontend Next.js development server (see [Frontend Setup](#2-frontend)).

2.  **Manage Documents via Web Interface**:
    *   Open your browser and navigate to the frontend application (usually `http://localhost:3000`).
    *   Use the interface to:
        *   Create new folders and text/markdown files.
        *   Upload existing documents (the backend will save them to the `vault`).
        *   Edit your text/markdown files.
        *   Organize your files and folders.
    *   *Note: The current frontend might need to be adapted or built out to fully support all backend API functionalities like file uploads if not already present.*

3.  **Process Documents for Q&A**:
    *   Ensure your documents are in the `vault` directory if you want the notebooks to process them directly from there, or place/copy them into the `notebooks/data` directory. (You might need to adjust paths in `Document_Ingestion_Chunking.ipynb` if you want it to read directly from the `../vault` instead of `notebooks/data`).
    *   Navigate to the `notebooks` directory.
    *   Run the `Document_Ingestion_Chunking.ipynb` notebook to process the documents, extract text, and create chunked JSON files in `notebooks/preprocessed`.
    *   Run the `Embedding_documents.ipynb` notebook to:
        *   Generate embeddings for these chunks.
        *   Store them in the ChromaDB vector database (`notebooks/chroma_db`).
        *   Once ingested (by running the `ingest_all()` cell or equivalent), you can use the `answer("Your question here")` function within the notebook to ask questions about your documents.

4.  **Query Your Documents**:
    *   In the `Embedding_documents.ipynb` notebook, use the provided QA cells (e.g., calling the `answer()` function) to ask questions. The system will retrieve relevant information from your documents and generate an answer.

This workflow allows you to maintain a personal knowledge base in the `vault` and then use the powerful RAG pipeline to intelligently query and retrieve information from it.
