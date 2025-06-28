#!/usr/bin/env python3
"""
Create a test PDF file for visualization testing
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
import io

def create_test_pdf(filename="test_pdf.pdf"):
    """Create a test PDF with interesting content for visualization"""
    
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("Artificial Intelligence and Machine Learning", title_style))
    story.append(Spacer(1, 20))
    
    # Introduction
    intro_text = """
    Artificial Intelligence (AI) represents a revolutionary field in computer science that aims to create systems capable of performing tasks that typically require human intelligence. 
    These tasks include learning, reasoning, problem-solving, perception, and language understanding.
    """
    story.append(Paragraph(intro_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Machine Learning Section
    story.append(Paragraph("Machine Learning Fundamentals", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    ml_text = """
    Machine Learning is a subset of AI that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. 
    The core concept involves training models on data to make predictions or decisions without being explicitly programmed for the task.
    
    There are three main types of machine learning:
    • Supervised Learning: Models learn from labeled training data
    • Unsupervised Learning: Models find patterns in unlabeled data
    • Reinforcement Learning: Models learn through interaction with an environment
    """
    story.append(Paragraph(ml_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Deep Learning Section
    story.append(Paragraph("Deep Learning and Neural Networks", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    dl_text = """
    Deep Learning is a specialized subset of machine learning that uses artificial neural networks with multiple layers to model and understand complex patterns in data. 
    These neural networks are inspired by the structure and function of biological brains.
    
    Key components of deep learning include:
    • Neural Networks: Interconnected nodes that process information
    • Convolutional Neural Networks (CNNs): Specialized for image processing
    • Recurrent Neural Networks (RNNs): Designed for sequential data
    • Transformers: Advanced architecture for natural language processing
    """
    story.append(Paragraph(dl_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Natural Language Processing
    story.append(Paragraph("Natural Language Processing", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    nlp_text = """
    Natural Language Processing (NLP) is a branch of AI that focuses on the interaction between computers and human language. 
    It enables machines to understand, interpret, and generate human language in a meaningful way.
    
    Applications of NLP include:
    • Text classification and sentiment analysis
    • Machine translation between languages
    • Question answering systems
    • Chatbots and virtual assistants
    • Text summarization and generation
    """
    story.append(Paragraph(nlp_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Computer Vision
    story.append(Paragraph("Computer Vision", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    cv_text = """
    Computer Vision is a field of AI that trains computers to interpret and understand visual information from the world. 
    It involves developing algorithms that can process, analyze, and make decisions based on visual data.
    
    Computer vision applications include:
    • Image recognition and classification
    • Object detection and tracking
    • Facial recognition systems
    • Medical image analysis
    • Autonomous vehicle perception
    """
    story.append(Paragraph(cv_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Ethics and Future
    story.append(Paragraph("Ethics and Future Implications", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    ethics_text = """
    As AI systems become more sophisticated, ethical considerations become increasingly important. 
    Key concerns include privacy, bias, transparency, and the potential impact on employment and society.
    
    The future of AI holds tremendous potential for:
    • Healthcare and medical diagnosis
    • Climate change and environmental protection
    • Education and personalized learning
    • Scientific research and discovery
    • Automation and efficiency improvements
    """
    story.append(Paragraph(ethics_text, styles['Normal']))
    story.append(Spacer(1, 15))
    
    # Conclusion
    story.append(Paragraph("Conclusion", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    conclusion_text = """
    Artificial Intelligence and Machine Learning represent transformative technologies that are reshaping our world. 
    From healthcare to transportation, from education to entertainment, AI is becoming an integral part of modern society. 
    Understanding these technologies is crucial for navigating the future and ensuring their responsible development and deployment.
    """
    story.append(Paragraph(conclusion_text, styles['Normal']))
    
    # Build the PDF
    doc.build(story)
    print(f"✅ Test PDF created: {filename}")

if __name__ == "__main__":
    create_test_pdf() 