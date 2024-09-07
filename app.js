const express = require('express');
const app = express();

const body_parser = require('body-parser');
app.use(body_parser.json());


require('dotenv').config()
const port = process.env.PORT || 3000;

const { Op, Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './mydb.sqlite',
});

const Books = sequelize.define('Book', {
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	price: {
		type: DataTypes.INTEGER,
		allowNull: false,
		validate: {
			isInt: true,
			min: 0,
		},
	},
});

sequelize.sync().then(() => { console.log('Sync is done'); });

app.post('/', async (req, res) => {
	const { title, price } = req.body;

	if (!title || !price) {
		return res.status(400).json({ message: 'Title and price are required' });
	}

	if (isNaN(price) || price < 0) {
		return res.status(400).json({ message: 'Price must be a non-negative number' });
	}

	try {
		const book = await Books.create({ title, price });
		res.status(201).json(book);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// pass min and max price
app.get('/', async (req, res) => {
	const { minprice, maxprice } = req.query;

	if (minprice === undefined) {
		return res.status(400).json({ message: 'minprice  query parameter is required' });
	}

	if (isNaN(minprice) || minprice < 0) {
		return res.status(400).json({ message: 'minprice must be a non-negative number' });
	}

	if (maxprice !== undefined && (isNaN(maxprice) || maxprice < minprice)) {
		return res.status(400).json({ message: 'maxprice must be a number greater than or equal to minprice' });
	}

	try {
		const result = await Books.findAll({
			where: {
				[Op.and]: [
					{
						price: {
							[Op.gte]: minprice,
							[Op.lte]: maxprice !== undefined ? maxprice : Infinity
						}
					}
				]
			},
		});
		res.status(200).json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	};
});

app.get('/:id', async (req, res) => {
	const { id } = req.params;

	if (isNaN(id)) {
		return res.status(400).json({ message: 'Invalid ID' });
	}

	try {
		const result = await Books.findByPk(id);
		if (!result) {
			return res.status(404).json({ message: 'Book not found' });
		}
		res.status(200).json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.delete('/:id', async (req, res) => {
	const { id } = req.params;

	if (isNaN(id)) {
		return res.status(400).json({ message: 'Invalid ID' });
	}

	try {
		const book = await Books.findByPk(id);

		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		await book.destroy();
		res.status(200).json({ message: 'Book deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.patch('/:id', async (req, res) => {
	const { id } = req.params;
	const { title, price } = req.body;

	if (isNaN(id)) {
		return res.status(400).json({ message: 'Invalid ID' });
	}

	if (!title && price === undefined) {
		return res.status(400).json({ message: 'At least one of title or price is required' });
	}

	if (price !== undefined && (isNaN(price) || price < 0)) {
		return res.status(400).json({ message: 'Price must be a non-negative number' });
	}

	try {
		const book = await Books.findByPk(id);

		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		if (title !== undefined) {
			book.title = title;
		}

		if (price !== undefined) {
			book.price = price;
		}

		await book.save();
		res.status(200).json(book);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.listen(port, () => {
	console.log(`Server is running on ${port} port`);
});