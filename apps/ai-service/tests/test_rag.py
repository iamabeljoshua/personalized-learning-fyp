"""Unit tests for the RAG processor (chunking and file reading)."""
import sys
import os
import tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from processors.rag import RAGProcessor


class TestRAGChunking:
    def setup_method(self):
        self.processor = RAGProcessor()

    def test_chunks_short_text(self):
        """Short text should produce a single chunk."""
        result = self.processor.embed_document.__wrapped__ if hasattr(self.processor.embed_document, '__wrapped__') else None
        # Test chunking directly via the splitter
        chunks = self.processor.splitter.split_text("Hello world. This is a short text.")
        assert len(chunks) == 1

    def test_chunks_long_text(self):
        """Long text should produce multiple chunks."""
        long_text = "This is a sentence about physics. " * 100
        chunks = self.processor.splitter.split_text(long_text)
        assert len(chunks) > 1

    def test_chunk_size_limit(self):
        """Each chunk should not exceed the configured chunk_size significantly."""
        long_text = "Word " * 500
        chunks = self.processor.splitter.split_text(long_text)
        for chunk in chunks:
            # Allow some overflow due to sentence boundary respect
            assert len(chunk) < 600  # chunk_size=500 + tolerance

    def test_chunk_overlap(self):
        """Consecutive chunks should have overlapping content."""
        long_text = ". ".join([f"Sentence number {i} about topic {i}" for i in range(100)])
        chunks = self.processor.splitter.split_text(long_text)
        if len(chunks) >= 2:
            # Check some text from end of chunk 0 appears in start of chunk 1
            last_words_chunk0 = chunks[0][-50:]
            first_words_chunk1 = chunks[1][:100]
            # With overlap=50, some content should be shared
            overlap_found = any(
                word in first_words_chunk1
                for word in last_words_chunk0.split()
                if len(word) > 3
            )
            assert overlap_found

    def test_empty_text_produces_no_chunks(self):
        chunks = self.processor.splitter.split_text("")
        assert len(chunks) == 0


class TestRAGFileReading:
    def setup_method(self):
        self.processor = RAGProcessor()

    def test_read_txt_file(self):
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Hello world from a text file.")
            f.flush()
            text = self.processor._read_file(f.name)
        os.unlink(f.name)
        assert "Hello world" in text

    def test_read_md_file(self):
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write("# Heading\n\nSome markdown content.")
            f.flush()
            text = self.processor._read_file(f.name)
        os.unlink(f.name)
        assert "Heading" in text
        assert "markdown content" in text

    def test_read_nonexistent_pdf_returns_empty(self):
        text = self.processor._read_pdf("/nonexistent/file.pdf")
        assert text == ""
