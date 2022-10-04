import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import marketplaceAbi from "../contract/marketplace.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

const ERC20_DECIMALS = 18;
const MPContractAddress = "0x1e2d4CbF3941628149121f4fE7c6c4Cb298C774C";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let stories = [];

const connectCeloWallet = async function () {
	if (window.celo) {
		notification(
			"Felicia Diaries is requesting permission to connect to your wallet: "
		);
		try {
			await window.celo.enable();
			notificationOff();

			const web3 = new Web3(window.celo);
			kit = newKitFromWeb3(web3);

			const accounts = await kit.web3.eth.getAccounts();
			kit.defaultAccount = accounts[0];

			contract = new kit.web3.eth.Contract(
				marketplaceAbi,
				MPContractAddress
			);
		} catch (error) {
			notification(`⚠️ ${error}.`);
		}
	} else {
		notification("Install the CeloExtensionWallet to use this Dapp.");
	}
};

async function approve(_price) {
	const cUSDContract = new kit.web3.eth.Contract(
		erc20Abi,
		cUSDContractAddress
	);

	const result = await cUSDContract.methods
		.approve(MPContractAddress, _price)
		.send({ from: kit.defaultAccount });
	return result;
}

const getBalance = async function () {
	const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
	const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
	document.querySelector("#balance").textContent = cUSDBalance;
};

const getStories = async function () {
	const _numberOfStoriesAvailable = await contract.methods
		.viewStoriesLength()
		.call();
	const _stories = [];

	for (let i = 0; i < _numberOfStoriesAvailable; i++) {
		let _story = new Promise(async (resolve, reject) => {
			let p = await contract.methods.readStory(i).call();
			resolve({
				index: i,
				owner: p[0],
				title: p[1],
				image: p[2],
				description: p[3],
				nLikes: p[4],
				comments: p[5],
				nSupporters: p[6],
				supportAmount: new BigNumber(p[7]),
			});
		});
		_stories.push(_story);
	}
	stories = await Promise.all(_stories);
	renderStory();
};

function renderStory() {
	document.getElementById("marketplace").innerHTML = "";
	stories.forEach((_story) => {
		const newDiv = document.createElement("div");
		newDiv.className = "col-md-4";
		newDiv.innerHTML = StoryTemplate(_story);
		document.getElementById("marketplace").appendChild(newDiv);
	});
}

function StoryTemplate(_story) {
	return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_story.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-light mt-4 px-2 py-1 rounded-start">Supported By: ${
			_story.nSupporters
		} people</div>
		<div class="position-absolute top-0 end-2 bg-light mt-4 px-2 py-1 rounded-start">Liked By: ${
			_story.nLikes
		} </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_story.owner)}
        </div>
        <center><h2 class="card-title fs-4 fw-bold mt-2 text-success">${_story.title}</h2></center>
        <p class="card-text mb-4 text-white" style="min-height: 82px">
          ${_story.description}             
        </p>

		<p><center>
		${(_story.owner === kit.defaultAccount)   ? `
        <a class="btn btn-outline-dark btn-md editStorybtn"  id=${_story.index} >
          edit story 
        </a>
		<a class="btn btn-outline-dark btn-md deleteStorybtn disabled"  id=${_story.index} >
          delete story 
        </a>
		`
          : 
		`<a class="btn btn-outline-dark btn-md likeStorybtn"  id=${_story.index} >
		like story 
	  </a>
	  <a class="btn btn-outline-dark btn-md dislikeStorybtn"  id=${_story.index} >
			dislike story
		  </a>
		  `}
		  <a class="btn btn-outline-dark btn-md writeCommentbtn"  id=${_story.index} >
			write a comment 
		  </a>
		</center></p>
		<div class="d-grid gap-2">
		${(_story.owner === kit.defaultAccount) ? "" : `<a class="btn btn-outline-dark btn-md supportbtn "  id=${_story.index} >
		Support author 
	  </a>`}
		</div>
		
  `;
}

function identiconTemplate(_address) {
	const icon = blockies
		.create({
			seed: _address,
			size: 8,
			scale: 16,
		})
		.toDataURL();

	return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

function notification(_text) {
	document.querySelector(".alert").style.display = "block";
	document.querySelector("#notification").textContent = _text;
}


function notificationOff() {
	document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
	notification("⌛ Loading...");
	await connectCeloWallet();
	await getBalance();
	await getStories();
	notificationOff();
});

document.querySelector("#newStoryBtn").addEventListener("click", async (e) => {
	const params = [
		document.getElementById("newStoryTitle").value,
		document.getElementById("newImgUrl").value,
		document.getElementById("newStoryDescription").value,
	];
	notification(` posting "${params[0]}"...`);
	try {
		const result = await contract.methods
			.writeStory(...params)
			.send({ from: kit.defaultAccount });
	} catch (error) {
		notification(`⚠️ ${error}.`);
	}
	notification(
		` "${params[0]}" added successfully `
	);
	getStories();
});

document.querySelector("#marketplace").addEventListener("click", async (e) => {
	if (e.target.className.includes("supportbtn")) {
		const index = e.target.id;
		let amount = Number(prompt("How much do you wish to donate? (cUSD)",1));
		if (typeof amount !== "number") {
			notification("amount entered is not a valid number");
			return;
		}
			try {
				notification("⌛ Waiting for donation approval...");
				await approve(amount);
			} catch (error) {
				notification(`⚠️ ${error}.`);
			}
			notification(
				`⌛ donation in progress`
			);
			try {
				amount = new BigNumber(amount).shiftedBy(ERC20_DECIMALS).toString();
				const result = await contract.methods
					.support(index, amount)
					.send({ from: kit.defaultAccount });
				notification(
					`donation successful `
				);
				getStories();
				getBalance();
			} catch (error) {
				notification(`⚠️ ${error}.`);
			}
		}
	
		if (e.target.className.includes("editStorybtn")) {
			const index = e.target.id;
			let newTitle = prompt(
				`Enter new Title for "${stories[index].title}":`,`${stories[index].title}_edited`
			);
			let newImageLink = prompt(`Enter new story image url for `,`${stories[index].image}`);
			let newDescription = prompt(`Enter new description for ${newTitle}`,`${stories[index].description}`);
			notification(`⌛ editing "${stories[index].title}"...`);
				try {
					const result = await contract.methods
						.editStory(index, newTitle, newImageLink,newDescription)
						.send({ from: kit.defaultAccount });
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				notification(
					`Story edit successful`
				);
				getBalance();
				getStories();
			} 

			if (e.target.className.includes("likeStorybtn")) {
				const index = e.target.id;
				try {
					const result = await contract.methods
						.likeStory(index)
						.send({ from: kit.defaultAccount });
						notification(
							`you liked ${stories[index].title}`
						);
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				getBalance();
				getStories();	
			}

			if (e.target.className.includes("dislikeStorybtn")) {
				const index = e.target.id;
				try {
					const result = await contract.methods
						.dislikeStory(index)
						.send({ from: kit.defaultAccount });
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				notification(
					`you disliked ${stories[index].title}`
				);
				getBalance();
				getStories();	
			}

			if (e.target.className.includes("writeCommentbtn")) {
				const index = e.target.id;
				let comment= prompt("write comment: ", "nice work");
				try {
					const result = await contract.methods
						.writeComment(index, comment)
						.send({ from: kit.defaultAccount });
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				notification(
					`comment successful`
				);
				getBalance();
				getStories();	
			}

			if (e.target.className.includes("viewCommentbtn")) {
				const index = e.target.id;
				try {
					const result = await contract.methods
						.viewComment(index)
						.send({ from: kit.defaultAccount });
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				notification(
					"retriving comments"
				);
				getBalance();
				getStories();	
			}

			if (e.target.className.includes("deleteStorybtn")) {
				const index = e.target.id;
				try {
					const result = await contract.methods
						.eraseStory(index)
						.send({ from: kit.defaultAccount });
						notification(
							`you deleted ${stories[index].title}`
						);
				} catch (error) {
					notification(`⚠️ ${error}.`);
				}
				getBalance();
				getStories();	
			}
		
});