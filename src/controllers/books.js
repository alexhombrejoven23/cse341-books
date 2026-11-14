import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    authorExists,
} from '../models/books.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'publicationDate must use the format YYYY-MM-DD';
const INVALID_AUTHOR_MESSAGE = 'authorId does not match an existing author';

const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim() !== '';
};

const isValidDate = (value) => {
    if (!DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getBooksHandler = async (req, res) => {
    try {
        const books = await getAllBooks();
        return res.status(200).json(books);
    } catch (error) {
        console.error('GET /books failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getBookByIdHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const book = await getBookById(requestedId);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        return res.status(200).json(book);
    } catch (error) {
        console.error('GET /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createBookHandler = async (req, res) => {
    try {
        const { id, authorId, title, publicationDate } = req.body ?? {};

        if (
            !isNonEmptyString(id) ||
            !isNonEmptyString(authorId) ||
            !isNonEmptyString(title) ||
            !isNonEmptyString(publicationDate)
        ) {
            return res
                .status(400)
                .json({ message: 'id, authorId, title, and publicationDate are required' });
        }

        if (!isValidDate(publicationDate)) {
            return res.status(400).json({ message: DATE_MESSAGE });
        }

        const newBook = {
            id: id.trim(),
            authorId: authorId.trim(),
            title: title.trim(),
            publicationDate,
        };

        const existingBook = await getBookById(newBook.id);
        if (existingBook) {
            return res.status(400).json({ message: 'A book with this id already exists' });
        }

        if (!(await authorExists(newBook.authorId))) {
            return res.status(400).json({ message: INVALID_AUTHOR_MESSAGE });
        }

        const createdBook = await createBook(newBook);
        return res.status(201).json(createdBook);
    } catch (error) {
        console.error('POST /books failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateBookHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const { authorId, title, publicationDate } = req.body ?? {};

        if (
            !isNonEmptyString(authorId) ||
            !isNonEmptyString(title) ||
            !isNonEmptyString(publicationDate)
        ) {
            return res
                .status(400)
                .json({ message: 'authorId, title, and publicationDate are required' });
        }

        if (!isValidDate(publicationDate)) {
            return res.status(400).json({ message: DATE_MESSAGE });
        }

        const existingBook = await getBookById(requestedId);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const changes = {
            authorId: authorId.trim(),
            title: title.trim(),
            publicationDate,
        };

        if (!(await authorExists(changes.authorId))) {
            return res.status(400).json({ message: INVALID_AUTHOR_MESSAGE });
        }

        const updatedBook = await updateBook(requestedId, changes);
        return res.status(200).json(updatedBook);
    } catch (error) {
        console.error('PUT /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteBookHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const existingBook = await getBookById(requestedId);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        await deleteBook(requestedId);
        return res.status(204).send();
    } catch (error) {
        console.error('DELETE /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    getBooksHandler,
    getBookByIdHandler,
    createBookHandler,
    updateBookHandler,
    deleteBookHandler,
};