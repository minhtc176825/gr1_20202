import * as crypto from 'crypto'
import { resolve } from 'node:path'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

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
  wallets: Wallet[]

  constructor() {
    this.chain = [
      new TxBlock('', new Transaction(100, 'genesis', 'minh'))
    ]

    this.wallets = []
  }

  addWallet(wallet: Wallet) {
    this.wallets.push(wallet)
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
  public id: number
  public publicKey: string
  public privateKey: string
  public name: string
  public balance: number
  constructor(name: string, balance: number) {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.id = Chain.instance.wallets.length
    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
    this.name = name
    this.balance = balance
  }



  sendMoney(amount: number, payeePublicKey: string) {

    this.balance -= amount
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

  showCandidates() {
    for (var i = 0; i < this.candidates.length; i++) {
      console.log(this.candidates[i].id + ' - ' + this.candidates[i].name + ' - ' + this.candidates[i].voteCount)
    }
  }
}

Election.instance.addCandidate('MINH')
Election.instance.addCandidate('TRANG')
Election.instance.addCandidate('QUAN')

const satoshi = new Wallet('satoshi', 100)
Chain.instance.addWallet(satoshi)
const bob = new Wallet('bob', 100);
Chain.instance.addWallet(bob)
const alice = new Wallet('alice', 100);
Chain.instance.addWallet(alice)

var user = Chain.instance.wallets[0]

function menu() {
  console.log('------------------------')
  console.log('----E-VOTING SYSTEM ----')
  console.log('1. View candidate list')
  console.log('2. Vote')
  console.log('3. Transfer money')
  console.log('4. Switch wallet')
  console.log('5. Check balance')
  console.log('6. Get data from blockchain')
  console.log('7. Quit')
  console.log('------------------------')
}

function switchWallet(wallet: number) {
  for (var i = 0; i < Chain.instance.wallets.length; i++) {
    if (wallet === Chain.instance.wallets[i].id) {
      return true
    }
  }
  return false
}

// check if wallet exists or not
function checkWallet(wallet: string) {
  for (var i = 0; i < Chain.instance.wallets.length; i++) {
    if (wallet === Chain.instance.wallets[i].name) return true
  }

  return false
}

// check if the wallet's balance is enough
function checkBalance(amount: number) {
  if (user.balance < amount) {
    return false
  } 

  return true
}

// get wallet by name
function getWalletPubKeyByName(name: string) {
  for (var i = 0; i < Chain.instance.wallets.length; i++) {
    if (name === Chain.instance.wallets[i].name) return Chain.instance.wallets[i].publicKey
  }

  return ''
}

function getWalletIdByName(name: string) {
  for (var i = 0; i < Chain.instance.wallets.length; i++) {
    if (name === Chain.instance.wallets[i].name) return Chain.instance.wallets[i].id
  }

  return -1
}


function newRequest() {
  rl.question('Enter: ', (choice) => {
    switch(choice) {
      case '1':
        console.log('Candidate list: ')
        Election.instance.showCandidates()
        menu()
        newRequest()
        break
      case '2':

        rl.question('You would like to vote for: ', (id) => {
          user.vote(parseInt(id))
          console.log('Thanks for voting. Here is the result:')
          Election.instance.showCandidates()
          menu()
          newRequest()
        })
        break
      case '3':
        rl.question('Who you want to send money: ', (name) => {
          
          if (checkWallet(name)) {
            
            rl.question('How much you would like to send: ', (amount) => {
              if (checkBalance(parseInt(amount))) {

                user.sendMoney(parseInt(amount), getWalletPubKeyByName(name))
                Chain.instance.wallets[getWalletIdByName(name)].balance += parseInt(amount)
                console.log('Send successfully')
                menu()
                newRequest()
              } else {
                console.log('Not enough balance. Please try again next time.')
                menu()
                newRequest()
              }
              
            })
          } else {
            console.log('This wallet does not exist')
            menu()
            newRequest()
          }
        })
        break
      case '4':
        rl.question('Switch to wallet (enter the wallet id): ', (id) => {
          if (switchWallet(parseInt(id))) {
            user = Chain.instance.wallets[parseInt(id)]
            console.log('Switched')
            console.log('Current wallet: ' + user.name)
            menu()
            newRequest()
          } else {
            console.log('Wallet does not exist')
            menu()
            newRequest()
          }
          
        })
        break
      case '5':
        console.log('Balance: ' + user.balance)
        menu()
        newRequest()
        break
      case '6':
        console.log('BLOCKCHAIN: ')
        console.log(Chain.instance.chain) 
        menu()
        newRequest()
        break
      case '7':
        console.log('Exiting...')
        rl.close()
        break
      default: break
    }
  })
  
}

console.log('Current wallet: ' + user.name)
menu()
newRequest()






