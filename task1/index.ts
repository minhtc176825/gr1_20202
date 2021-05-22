import * as crypto from 'crypto'
import * as readline from 'readline'

const rl = readline.createInterface ({
  input: process.stdin,
  output: process.stdout
})

class Block {
  readonly hash: string

  constructor (
    readonly index: number,
    readonly previousHash: string,
    readonly timestamp: number,
    readonly data: string
  ) {
    this.hash = this.calculateHash()
  }

  private calculateHash(): string {
    const data = this.index + this.previousHash + this.timestamp + this.data

    return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex')
  }
}

class Blockchain {
  public readonly chain: Block[] = []

  private get lastestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  constructor() {
    this.chain.push(
      new Block(0, '0', Date.now(), 'genesis')
    )
  }

  addBlock(data: string): void {
    const block = new Block(
      this.lastestBlock.index + 1,
      this.lastestBlock.hash,
      Date.now(),
      data
    )

    this.chain.push(block)
  }
}


function delay(ms: number)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}



console.log('Creating the blockchain with the genesis block...')
const blockchain = new Blockchain()

const data = ['First block', 'Second block', 'Third block', 'Forth block']

async function mineBlock(data: string) {

  console.log('\n ⛏️ ⛏️  Mining block #' + blockchain.chain.length + '...\n')
  await delay(3000)
  blockchain.addBlock(data)
  console.log('Successfully\n')
  
}

async function getData() {
  for (var i = 0; i < data.length; i++) {
    await mineBlock(data[i])
  }
  console.log('\n ⛏️ ⛏️  Waiting for new block...\n')
  
}

getData()
