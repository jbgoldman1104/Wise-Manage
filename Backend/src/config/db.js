const {
  MONGO_HOST = "localhost",
  MONGO_PORT = 27017,
  MONGO_DATABASE = "wiseman",
} = process.env;

const MONGO_URI = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;

const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

module.exports = {
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DATABASE,
  MONGO_URI,
  MONGO_OPTIONS,
};
