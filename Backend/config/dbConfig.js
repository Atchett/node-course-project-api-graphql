// db config
exports.MONGODB_OLD_URIFORMAT = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00.hrm10.mongodb.net:27017,cluster0-shard-00-01.hrm10.mongodb.net:27017,cluster0-shard-00-02.hrm10.mongodb.net:27017/${process.env.MONGO_DB}?ssl=true&replicaSet=atlas-9469ec-shard-0&authSource=admin&retryWrites=true&w=majority`;

exports.MONGODB_CONNECTION_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
