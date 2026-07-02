const { S3Client, CreateBucketCommand, PutBucketPolicyCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3')

// Configuração
const REGION = process.env.APP_AWS_REGION || 'sa-east-1'
const BUCKET_NAME = process.env.APP_AWS_S3_BUCKET || 'shopping-intranet-assets'

// Cliente S3
const client = new S3Client({ region: REGION })

async function setupBucket() {
  console.log(`🚀 Iniciando configuração do S3 na região ${REGION}...`)
  console.log(`📦 Bucket alvo: ${BUCKET_NAME}`)

  try {
    // 1. Criar o Bucket
    console.log('Attempts to create bucket...')
    try {
        await client.send(new CreateBucketCommand({
            Bucket: BUCKET_NAME,
        }))
        console.log(`✅ Bucket ${BUCKET_NAME} criado com sucesso!`)
    } catch (e) {
        if (e.name === 'BucketAlreadyOwnedByYou') {
            console.log(`ℹ️ O bucket ${BUCKET_NAME} já existe e é seu.`)
        } else if (e.name === 'BucketAlreadyExists') {
            console.error(`❌ O nome de bucket "${BUCKET_NAME}" já está em uso por outra pessoa no mundo. Escolha outro nome no .env.`)
            return
        } else {
            throw e
        }
    }

    // 2. Desbloquear Acesso Público (Public Access Block)
    console.log('🔓 Configurando acesso público...')
    await client.send(new PutPublicAccessBlockCommand({
        Bucket: BUCKET_NAME,
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            IgnorePublicAcls: false,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false
        }
    }))
    console.log('✅ Bloqueio de acesso público removido.')

    // 3. Aplicar Política de Leitura Pública
    console.log('📜 Aplicando política de leitura...')
    const readPolicy = {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PublicReadGetObject",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${BUCKET_NAME}/*` // Allow access to all files
            }
        ]
    }

    await client.send(new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(readPolicy)
    }))
    console.log('✅ Política de leitura pública aplicada com sucesso.')

    console.log('\n🎉 Configuração do S3 finalizada! O upload deve funcionar agora.')

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error)
  }
}

setupBucket()
