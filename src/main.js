import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import marketplaceAbi from '../contract/marketplace.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x351270fAb99A6BD4283A7865683101B73ab53BC0"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let stories = []

const connectCeloWallet = async function () {
    if (window.celo) {
      try {
        notification("FeliciaDiaries is asking for permission to connect to your celo wallet.")
        await window.celo.enable()
        notificationOff()
        const web3 = new Web3(window.celo)
        kit = newKitFromWeb3(web3)
  
        const accounts = await kit.web3.eth.getAccounts()
        kit.defaultAccount = accounts[0]
  
        contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    } else {
      notification(" kindle install the CeloExtensionWallet to use this Dapp.")
    }
  }

  const getBalance = async function () {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.querySelector("#balance").textContent = cUSDBalance
  }

  const getStories = async function() {
    const _storiesLength = await contract.methods.viewEventLength().call()
    const _stories = []
    for (let i = 0; i < _storiesLength; i++) {
        let _story = new Promise(async (resolve, reject) => {
          let p = await contract.methods.readStory(i).call()
          resolve({
            index: i,
            owner: p[0],
            title: p[1],
            image: p[2],
            description: p[3],
            nLikes: p[4],
            nDislikes: p[5],
            comments: p[6],
            nComments: p[7],
            nSupports: p[8],
            tSupports: p[9]
          })
        })
        _stories.push(_story)
      }
      stories = await Promise.all(_stories)
      renderStories()
    }

  function renderStories() {
        document.getElementById("marketplace").innerHTML = ""
        stories.forEach((_story) => {
          const newDiv = document.createElement("div")
          newDiv.className = "col-md-4"
          newDiv.innerHTML = storyTemplate(_story)
          document.getElementById("marketplace").appendChild(newDiv)
        })
        document.getElementById("heart").onclick = function(){
            document.querySelector(".fa-gratipay").style.color = "#E74C3C";
        };
      }

   

function storyTemplate(_story){
    return `
    <div class="container">
    <i class="bi bi-journal-text"></i>
    <div class="cardcontainer">
        <div class="photo">
            <img src="${_story.image}">
        </div>
        <div class="translate-middle-y position-absolute">${identiconTemplate(_story.owner)}</div>

        <div class="content">
            <p class="txt4 text-danger">${_story.title}</p>
            <p class="txt5"></p>
            <p class="txt2">${_story.description}</p>
        </div>
        <div class="footer">
            <p><button class="waves-effect waves-light btn btn-outline-danger" id=${_story.index} >Support</button>
            <a  id=${_story.index} class="like heart" ><i class="fab fa-gratipay" ></i>Like</a> 
            <a  class="dislike bad" id=${_story.index}><i class="fas fa-thumbs-down fa-gratipay"></i>dislike</a></p>
            <p class="txt3"><i class="far fa-clock"></i>10 Minutes Ago 
            <span class="comments" ><i class="fas fa-comments"></i>45 Comments</span>
            <button class="btn btn-outline-light text-dark" id=${_story.index}>write a comment</button></p>
            
           
        </div>
    </div>
</div>
    `
}

function identiconTemplate(_address) {
    const icon = blockies
      .create({
        seed: _address,
        size: 8,
        scale: 16,
      })
      .toDataURL()
  
    return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
  }

  async function approve(_price) {
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)
  
    const result = await cUSDContract.methods
      .approve(MPContractAddress, _price)
      .send({ from: kit.defaultAccount })
    return result
  }

  function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
  }
  
  function notificationOff() {
    document.querySelector(".alert").style.display = "none"
  }

  window.addEventListener('load', async () => {
    notification("connecting...")
    await connectCeloWallet()
    await getBalance()
    await getStories()
    notificationOff()
  });

  document
  .querySelector("#newStoryBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newStoryTitle").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newStoryDescription").value
    ]
    notification(` posting "${params[0]}"...`)
    try {
        const result = await contract.methods
          .writeStory(...params)
          .send({ from: kit.defaultAccount })
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      notification(`posted "${params[0]}" successfully.`)
      getStories()
    })


    document.querySelector("#marketplace").addEventListener("click", async (e) => {
        if (e.target.className.includes("buyBtn")) {
          const index = e.target.id
          notification("⌛ Waiting for payment approval...")
          try {
            await approve(products[index].price)
          } catch (error) {
            notification(`⚠️ ${error}.`)
          }
          notification(`⌛ Awaiting payment for "${products[index].name}"...`)
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought "${products[index].name}".`)
      getProducts()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }

//support btn function
  if (e.target.className.includes("waves-effect waves-light btn btn-outline-danger")) {
    let price = Number(prompt("How much do you do wish to donate: ","1"))
    const index = e.target.id 
    notification("⌛ donation approval in progress ...")
    try {
      await approve(price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(` donating ${price} cUSD to "${stories[index].title}"...`)
try {
const result = await contract.methods
  .support(index,price*(Math.pow(10,18)))
  .send({ from: kit.defaultAccount })
notification(`Donation successful`)
getStories()
getBalance()
} catch (error) {
notification(`⚠️ ${error}.`)
}
}

//like btn function
if (e.target.className.includes("like")) {
    const index = e.target.id 
    notification(` liking  "${stories[index].title}"...`)
try {
const result = await contract.methods
  .likeStory(index)
  .send({ from: kit.defaultAccount })
notification(`liked ${stories[index].title} `)
getStories()
} catch (error) {
notification(`⚠️ ${error}.`)
}
}

//dislike btn function
if (e.target.className.includes("dislike")) {
    const index = e.target.id 
    notification(` disliking  "${stories[index].title}"...`)
try {
const result = await contract.methods
  .dislikeStory(index)
  .send({ from: kit.defaultAccount })
notification(`disliked ${stories[index].title} `)
getStories()
} catch (error) {
notification(`⚠️ ${error}.`)
}
}

//comment btn function
if (e.target.className.includes("btn btn-outline-light text-dark")) {
    const comment=prompt("Write your comment","Nice work")
    const index = e.target.id 
    notification(` posting comment  "${stories[index].title}"...`)
try {
const result = await contract.methods
  .writeComment(index,comment)
  .send({ from: kit.defaultAccount })
notification(` comment successful `)
getStories()
notificationOff()
} catch (error) {
notification(`⚠️ ${error}.`)
}
}
})

