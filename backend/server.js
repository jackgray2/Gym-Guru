const express = require('express');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3001;

// Configure AWS SDK with environment variables
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USER_TABLE = 'Users';

app.use(cors());
app.use(bodyParser.json());

app.post('/signup', async (req, res) => {
  const { name, username, email, phone, zipCode, fitnessGoals, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 8);

  const params = {
    TableName: USER_TABLE,
    Item: {
      UserID: username, // Using username as a unique identifier
      Name: name,
      Email: email,
      Phone: phone,
      ZipCode: zipCode,
      FitnessGoals: fitnessGoals,
      Password: hashedPassword,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during signup:', error); // Log the error
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const params = {
    TableName: USER_TABLE,
    Key: {
      UserID: username,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    const user = result.Item;

    if (user && bcrypt.compareSync(password, user.Password)) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error); // Log the error
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});