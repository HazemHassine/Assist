#!/usr/bin/env python3
"""
Test runner for the enhanced Python service
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

def run_tests(test_file=None, verbose=False, coverage=False):
    """Run the test suite"""
    
    # Add the current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Set up pytest arguments
    pytest_args = ["-v" if verbose else "-q"]
    
    if coverage:
        pytest_args.extend(["--cov=services", "--cov-report=html", "--cov-report=term"])
    
    if test_file:
        pytest_args.append(test_file)
    else:
        pytest_args.append("test_enhanced_services.py")
    
    # Run pytest
    try:
        result = subprocess.run([sys.executable, "-m", "pytest"] + pytest_args, 
                              cwd=os.path.dirname(os.path.abspath(__file__)))
        return result.returncode == 0
    except Exception as e:
        print(f"Error running tests: {e}")
        return False

def run_specific_test(test_name):
    """Run a specific test by name"""
    pytest_args = ["-v", "-k", test_name, "test_enhanced_services.py"]
    
    try:
        result = subprocess.run([sys.executable, "-m", "pytest"] + pytest_args,
                              cwd=os.path.dirname(os.path.abspath(__file__)))
        return result.returncode == 0
    except Exception as e:
        print(f"Error running specific test: {e}")
        return False

def run_integration_tests():
    """Run integration tests"""
    print("Running integration tests...")
    
    # Test text compression
    print("\n1. Testing text compression...")
    try:
        from services.text_compressor import TextCompressor
        compressor = TextCompressor()
        
        long_text = "This is a very long text that needs to be compressed. " * 50
        result = compressor.compress_text(long_text, target_length=200)
        
        print(f"✓ Text compression successful")
        print(f"  Original length: {result['original_length']}")
        print(f"  Compressed length: {result['compressed_length']}")
        print(f"  Compression ratio: {result['compression_ratio']:.2f}")
        
    except Exception as e:
        print(f"✗ Text compression failed: {e}")
        return False
    
    # Test enhanced graph builder
    print("\n2. Testing enhanced graph builder...")
    try:
        import asyncio
        from services.enhanced_graph_builder import EnhancedGraphBuilder
        
        builder = EnhancedGraphBuilder(use_openrouter=False, compression_target=500)
        
        text = """
        Artificial Intelligence is transforming the world. Machine Learning algorithms 
        are being used in various applications. Deep Learning models have achieved remarkable 
        results in computer vision and natural language processing.
        """
        metadata = {"title": "AI Overview", "author": "Test"}
        
        async def test_graph():
            return await builder.build_graph(text, metadata)
        
        result = asyncio.run(test_graph())
        
        print(f"✓ Graph building successful")
        print(f"  Total nodes: {result['total_nodes']}")
        print(f"  Total edges: {result['total_edges']}")
        print(f"  AI used: {result['ai_used']}")
        
    except Exception as e:
        print(f"✗ Graph building failed: {e}")
        return False
    
    # Test OpenRouter service (without API key)
    print("\n3. Testing OpenRouter service...")
    try:
        from services.openrouter_service import OpenRouterService
        
        service = OpenRouterService(api_key=None)
        
        # Test prompt creation
        prompt = service._create_graph_prompt("Test text", {"title": "Test"})
        assert "Test text" in prompt
        assert "knowledge graph" in prompt.lower()
        
        print(f"✓ OpenRouter service initialization successful")
        print(f"  API key configured: {service.api_key is not None}")
        
    except Exception as e:
        print(f"✗ OpenRouter service failed: {e}")
        return False
    
    print("\n✓ All integration tests passed!")
    return True

def main():
    parser = argparse.ArgumentParser(description="Run tests for the enhanced Python service")
    parser.add_argument("--test-file", help="Specific test file to run")
    parser.add_argument("--test-name", help="Specific test name to run")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    
    args = parser.parse_args()
    
    if args.integration:
        success = run_integration_tests()
    elif args.test_name:
        success = run_specific_test(args.test_name)
    else:
        success = run_tests(args.test_file, args.verbose, args.coverage)
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 