const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb')

// Configuração
const REGION = 'sa-east-1'
const TABLE_PREFIX = 'ShoppingIntranet_'

// Cliente DynamoDB (lê credenciais do ~/.aws/credentials ou env vars padrão)
const client = new DynamoDBClient({ region: REGION })

const tables = [
  {
    TableName: `${TABLE_PREFIX}Users`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Properties`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Stores`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Clients`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Tasks`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Events`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Notifications`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Logs`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}FloorPlans`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${TABLE_PREFIX}Leads`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
]

async function createTables() {
  console.log(`Iniciando criação de tabelas na região ${REGION}...`)

  for (const tableConfig of tables) {
    try {
      console.log(`Criando tabela: ${tableConfig.TableName}...`)
      const command = new CreateTableCommand(tableConfig)
      await client.send(command)
      console.log(`✅ Tabela ${tableConfig.TableName} criada com sucesso!`)
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(`⚠️ Tabela ${tableConfig.TableName} já existe. Ignorando.`)
      } else {
        console.error(`❌ Erro ao criar tabela ${tableConfig.TableName}:`, error.message)
      }
    }
  }
  
  console.log('\nProcesso finalizado!')
}

createTables()
