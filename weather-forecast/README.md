# USECASES SPECIFICATION

## Use case 1: Search for the weather's info

### Brief description: 
The user requests to search the weather's information.

### Actor: 
1. The user
2. The smart contract (node)
3. The oracle

### Normal flow:
1. The user chooses the time and the place he/she wants to search the weather's info
2. The contract emits the event to request data from the oracle
3. The oracle processes the use case "Get data from external" 
4. The oracle processes the use case "Add new data"
5. The contract returns the data to the user.

## Use case 2: View history

### Brief description: 
The user requests to view search history.

### Actor:
1. The user
2. The smart contract (node)

## Normal flow:
1. The user requests to view to the search history
2. The contract returns the data which stored on the on-chain oracle

## Use case 3: Access to oracle

### Brief description:
The contract specifies the address of the oracle it uses.

## Actor: 
1. The contract

## Normal flow

1. The contract gets the address of the oracle it would like to use
2. The contract sets the oracle address to the new address. 


## Use case 4: Get the data from external source

### Brief description
When receiving the request from contract, the oracle calls a function to get the data chosen from many external sources.

### Actor: 
1. The oracle (off-chain and on-chain)

### Normal flow
1. The on-chain oracle calls a function to request external data
2. The off-chain oracle calls API to get the right data requested by the user
3. From the result, calculate the temperature and other conditions to get the advice for the user.
4. The on-chain oracle calls the use case "Add new data" 


## Use case 5: Add new data 

## Brief description: 
The oracle adds new data to the blockchain to allow other contracts to access.

## The actor
1. The oracle

## Normal flow

1. The on-chain oracle gets the data from off-chain oracle.
2. The on-chain oracle adds new block to the blockchain