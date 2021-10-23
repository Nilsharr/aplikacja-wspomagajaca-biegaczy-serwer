const models = require("express-cassandra");

models.setDirectory(__dirname + '/../api/models').bindAsync(
    {
        clientOptions: {
            contactPoints: ['localhost:9041', 'localhost:9042', 'localhost:9043'],
            localDataCenter: 'DC1',
            keyspace: 'catalog',
            queryOptions: { consistency: models.consistencies.one }
        },
        ormOptions: {
            defaultReplicationStrategy: {
                class: 'NetworkTopologyStrategy',
                replication_factor: 2
            },
            migration: 'safe'
        }
    },
    function (err) {
        if (err) {
            throw err;
        }
        console.log("initialized");
    }
);
module.exports = models;

