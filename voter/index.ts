import * as crypto from 'crypto'

class Transaction {
  constructor(
    public amount: number,
    public payer: string,
    public payee: string,
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

// vote for a candidate
class Vote {
  constructor(
    public candidateID: number,
    public voter: string,
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

class Block {

  public nonce = Math.round(Math.random() * 999999)
  public ts = Date.now()

  constructor(
    public prevHash: string,
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

class TxBlock extends Block {
  //public nonce = Math.round(Math.random() * 999999)
  
  constructor(
    public prevHash: string,
    public transaction: Transaction,
  ) {
    super(prevHash)
  }
}

class voteBlock extends Block {
  
  constructor(
    public prevHash: string,
    public vote: Vote,
  ) {
    super(prevHash)
  }
}

class Chain {
  public static instance = new Chain()

  chain: Block[]

  constructor() {
    this.chain = [
      new TxBlock('', new Transaction(100, 'genesis', 'minh'))
    ]
  }

  // Most recent block
  get lastBlock() {
    return this.chain[this.chain.length - 1]
  }

  // Proof of work system
  mine (nonce: number) {
    let solution = 1
    console.log('⛏️  mining...')

    while (true) {
      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest('hex');

      if(attempt.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }

  // Add a new block to the chain if valid signature & proof of work is complete
  addTxBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const verify = crypto.createVerify('SHA256');
    verify.update(transaction.toString());

    const isValid = verify.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new TxBlock(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }

  addVoteBlock(vote: Vote, senderPublicKey: string, signature: Buffer) {
    const verify = crypto.createVerify('SHA256')
    verify.update(vote.toString())

    const isValid = verify.verify(senderPublicKey, signature)

    if (isValid) {
      const newBlock = new voteBlock(this.lastBlock.hash, vote)
      this.mine(newBlock.nonce)
      this.chain.push(newBlock)
    }
  }
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey); 
    Chain.instance.addTxBlock(transaction, this.publicKey, signature);
  }

  vote(candidateId: number) {

    if (!Election.instance.voters.get(this.publicKey) && candidateId > 0 && candidateId <= Election.instance.candidates.length) {
      console.log('You have voted successfully!!')
      Election.instance.voters.set(this.publicKey, true)
      Election.instance.candidates[candidateId-1].voteCount++

      const vote = new Vote(candidateId, this.publicKey)

      const sign = crypto.createSign('SHA256')
      sign.update(vote.toString()).end()

      const signature = sign.sign(this.privateKey)
      Chain.instance.addVoteBlock(vote, this.publicKey, signature)
    } else {
      console.log('You can just vote once!!')
    }
  }
}

class Candidate {
  constructor(
    public id: number,
    public name: string,
    public voteCount: number,
  ) {}
}

class Election {

  public static instance = new Election()
  candidates: Candidate[]
  voters: Map<string, boolean>

  constructor() {
    this.candidates = [],
    this.voters = new Map()
  }

  addCandidate(_name: string) {
    return this.candidates.push(new Candidate(this.candidates.length + 1, _name, 0))
  }

  // vote (_candidateId: number) {
  //   if (!this.voters.get(_candidateId) && _candidateId > 0 && _candidateId <= this.candidates.length) {
  //     this.voters.set(_candidateId, true)
  //     this.candidates[_candidateId - 1].voteCount++
  //     return 1
  //   } else return 0
  // }
}

Election.instance.addCandidate('MINH')
Election.instance.addCandidate('TRANG')
Election.instance.addCandidate('QUAN')

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

satoshi.vote(1)
bob.vote(2)
alice.vote(1)
satoshi.vote(2)

console.log(Chain.instance)
console.log('-----------------')
console.log('Election result: ')
console.log(Election.instance.candidates)




