"use strict";

var _web = _interopRequireDefault(require("web3"));

var _contractkit = require("@celo/contractkit");

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _marketplaceAbi = _interopRequireDefault(require("../contract/marketplace.abi.json"));

var _erc20Abi = _interopRequireDefault(require("../contract/erc20.abi.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var ERC20_DECIMALS = 18;
var MPContractAddress = "0x1ae8eB0b5649f2F8D629507F3D6767E6e9F829A3";
var cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
var kit;
var contract;
var stories = [];

var connectCeloWallet = function connectCeloWallet() {
  var web3, accounts;
  return regeneratorRuntime.async(function connectCeloWallet$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!window.celo) {
            _context.next = 20;
            break;
          }

          notification("Felicia Diaries is requesting permission to connect to your wallet: ");
          _context.prev = 2;
          _context.next = 5;
          return regeneratorRuntime.awrap(window.celo.enable());

        case 5:
          notificationOff();
          web3 = new _web["default"](window.celo);
          kit = (0, _contractkit.newKitFromWeb3)(web3);
          _context.next = 10;
          return regeneratorRuntime.awrap(kit.web3.eth.getAccounts());

        case 10:
          accounts = _context.sent;
          kit.defaultAccount = accounts[0];
          contract = new kit.web3.eth.Contract(_marketplaceAbi["default"], MPContractAddress);
          _context.next = 18;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](2);
          notification("\u26A0\uFE0F ".concat(_context.t0, "."));

        case 18:
          _context.next = 21;
          break;

        case 20:
          notification("Install the CeloExtensionWallet to use this Dapp.");

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[2, 15]]);
};

function approve(_price) {
  var cUSDContract, result;
  return regeneratorRuntime.async(function approve$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          cUSDContract = new kit.web3.eth.Contract(_erc20Abi["default"], cUSDContractAddress);
          _context2.next = 3;
          return regeneratorRuntime.awrap(cUSDContract.methods.approve(MPContractAddress, _price).send({
            from: kit.defaultAccount
          }));

        case 3:
          result = _context2.sent;
          return _context2.abrupt("return", result);

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  });
}

var getBalance = function getBalance() {
  var totalBalance, cUSDBalance;
  return regeneratorRuntime.async(function getBalance$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(kit.getTotalBalance(kit.defaultAccount));

        case 2:
          totalBalance = _context3.sent;
          cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
          document.querySelector("#balance").textContent = cUSDBalance;

        case 5:
        case "end":
          return _context3.stop();
      }
    }
  });
};

var getStories = function getStories() {
  var _numberOfStoriesAvailable, _stories, _loop, i;

  return regeneratorRuntime.async(function getStories$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(contract.methods.viewStoriesLength().call());

        case 2:
          _numberOfStoriesAvailable = _context5.sent;
          _stories = [];

          _loop = function _loop(i) {
            var _story = new Promise(function _callee(resolve, reject) {
              var p;
              return regeneratorRuntime.async(function _callee$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      _context4.next = 2;
                      return regeneratorRuntime.awrap(contract.methods.readStory(i).call());

                    case 2:
                      p = _context4.sent;
                      resolve({
                        index: i,
                        owner: p[0],
                        title: p[1],
                        image: p[2],
                        description: p[3],
                        nLikes: p[4],
                        comments: p[5],
                        nSupporters: p[6],
                        supportAmount: new _bignumber["default"](p[7])
                      });

                    case 4:
                    case "end":
                      return _context4.stop();
                  }
                }
              });
            });

            _stories.push(_story);
          };

          for (i = 0; i < _numberOfStoriesAvailable; i++) {
            _loop(i);
          }

          _context5.next = 8;
          return regeneratorRuntime.awrap(Promise.all(_stories));

        case 8:
          stories = _context5.sent;
          renderStory();

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  });
};

function renderStory() {
  document.getElementById("marketplace").innerHTML = "";
  stories.forEach(function (_story) {
    var newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = StoryTemplate(_story);
    document.getElementById("marketplace").appendChild(newDiv);
  });
}

function StoryTemplate(_story) {
  return "\n    <div class=\"card mb-4\">\n      <img class=\"card-img-top\" src=\"".concat(_story.image, "\" alt=\"...\">\n      <div class=\"position-absolute top-0 end-0 bg-light mt-4 px-2 py-1 rounded-start\">Supported By: ").concat(_story.nSupporters, " people</div>\n\t\t<div class=\"position-absolute top-0 end-2 bg-light mt-4 px-2 py-1 rounded-start\">Liked By: ").concat(_story.nLikes, " </div>\n      <div class=\"card-body text-left p-4 position-relative\">\n        <div class=\"translate-middle-y position-absolute top-0\">\n        ").concat(identiconTemplate(_story.owner), "\n        </div>\n        <center><h2 class=\"card-title fs-4 fw-bold mt-2 text-success\">").concat(_story.title, "</h2></center>\n        <p class=\"card-text mb-4 text-white\" style=\"min-height: 82px\">\n          ").concat(_story.description, "             \n        </p>\n\n\t\t<p><center>\n\t\t").concat(_story.owner === kit.defaultAccount ? "\n        <a class=\"btn btn-outline-dark btn-md editStorybtn\"  id=".concat(_story.index, " >\n          edit story \n        </a>\n\t\t<a class=\"btn btn-outline-dark btn-md deleteStorybtn disabled\"  id=").concat(_story.index, " >\n          delete story \n        </a>\n\t\t") : "<a class=\"btn btn-outline-dark btn-md likeStorybtn\"  id=".concat(_story.index, " >\n\t\tlike story \n\t  </a>\n\t  <a class=\"btn btn-outline-dark btn-md dislikeStorybtn\"  id=").concat(_story.index, " >\n\t\t\tdislike story\n\t\t  </a>\n\t\t  "), "\n\t\t  <a class=\"btn btn-outline-dark btn-md writeCommentbtn\"  id=").concat(_story.index, " >\n\t\t\twrite a comment \n\t\t  </a>\n\t\t</center></p>\n\t\t<div class=\"d-grid gap-2\">\n\t\t").concat(_story.owner === kit.defaultAccount ? "" : "<a class=\"btn btn-outline-dark btn-md supportbtn disabled\"  id=".concat(_story.index, " >\n\t\tSupport author \n\t  </a>"), "\n\t\t</div>\n\t\t\n  ");
}

function identiconTemplate(_address) {
  var icon = blockies.create({
    seed: _address,
    size: 8,
    scale: 16
  }).toDataURL();
  return "\n  <div class=\"rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0\">\n    <a href=\"https://alfajores-blockscout.celo-testnet.org/address/".concat(_address, "/transactions\"\n        target=\"_blank\">\n        <img src=\"").concat(icon, "\" width=\"48\" alt=\"").concat(_address, "\">\n    </a>\n  </div>\n  ");
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", function _callee2() {
  return regeneratorRuntime.async(function _callee2$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          notification("⌛ Loading...");
          _context6.next = 3;
          return regeneratorRuntime.awrap(connectCeloWallet());

        case 3:
          _context6.next = 5;
          return regeneratorRuntime.awrap(getBalance());

        case 5:
          _context6.next = 7;
          return regeneratorRuntime.awrap(getStories());

        case 7:
          notificationOff();

        case 8:
        case "end":
          return _context6.stop();
      }
    }
  });
});
document.querySelector("#newStoryBtn").addEventListener("click", function _callee3(e) {
  var params, _contract$methods, result;

  return regeneratorRuntime.async(function _callee3$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          params = [document.getElementById("newStoryTitle").value, document.getElementById("newImgUrl").value, document.getElementById("newStoryDescription").value];
          notification(" posting \"".concat(params[0], "\"..."));
          _context7.prev = 2;
          _context7.next = 5;
          return regeneratorRuntime.awrap((_contract$methods = contract.methods).writeStory.apply(_contract$methods, params).send({
            from: kit.defaultAccount
          }));

        case 5:
          result = _context7.sent;
          _context7.next = 11;
          break;

        case 8:
          _context7.prev = 8;
          _context7.t0 = _context7["catch"](2);
          notification("\u26A0\uFE0F ".concat(_context7.t0, "."));

        case 11:
          notification(" \"".concat(params[0], "\" added successfully "));
          getStories();

        case 13:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[2, 8]]);
});
document.querySelector("#marketplace").addEventListener("click", function _callee4(e) {
  var index, newTitle, newImageLink, newDescription, result, _index, _result, _index2, _result2, _index3, comment, _result3, _index4, _result4, _index5, _result5, _index6, amount, _result6;

  return regeneratorRuntime.async(function _callee4$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          if (!e.target.className.includes("editStorybtn")) {
            _context8.next = 18;
            break;
          }

          index = e.target.id;
          newTitle = prompt("Enter new Title for \"".concat(stories[index].title, "\":"), "".concat(stories[index].title, "_edited"));
          newImageLink = prompt("Enter new story image url for ", "".concat(stories[index].image));
          newDescription = prompt("Enter new description for ".concat(newTitle), "".concat(stories[index].description));
          notification("\u231B editing \"".concat(stories[index].title, "\"..."));
          _context8.prev = 6;
          _context8.next = 9;
          return regeneratorRuntime.awrap(contract.methods.editStory(index, newTitle, newImageLink, newDescription).send({
            from: kit.defaultAccount
          }));

        case 9:
          result = _context8.sent;
          _context8.next = 15;
          break;

        case 12:
          _context8.prev = 12;
          _context8.t0 = _context8["catch"](6);
          notification("\u26A0\uFE0F ".concat(_context8.t0, "."));

        case 15:
          notification("Story edit successful");
          getBalance();
          getStories();

        case 18:
          if (!e.target.className.includes("likeStorybtn")) {
            _context8.next = 32;
            break;
          }

          _index = e.target.id;
          _context8.prev = 20;
          _context8.next = 23;
          return regeneratorRuntime.awrap(contract.methods.likeStory(_index).send({
            from: kit.defaultAccount
          }));

        case 23:
          _result = _context8.sent;
          notification("you liked ".concat(stories[_index].title));
          _context8.next = 30;
          break;

        case 27:
          _context8.prev = 27;
          _context8.t1 = _context8["catch"](20);
          notification("\u26A0\uFE0F ".concat(_context8.t1, "."));

        case 30:
          getBalance();
          getStories();

        case 32:
          if (!e.target.className.includes("dislikeStorybtn")) {
            _context8.next = 46;
            break;
          }

          _index2 = e.target.id;
          _context8.prev = 34;
          _context8.next = 37;
          return regeneratorRuntime.awrap(contract.methods.dislikeStory(_index2).send({
            from: kit.defaultAccount
          }));

        case 37:
          _result2 = _context8.sent;
          _context8.next = 43;
          break;

        case 40:
          _context8.prev = 40;
          _context8.t2 = _context8["catch"](34);
          notification("\u26A0\uFE0F ".concat(_context8.t2, "."));

        case 43:
          notification("you disliked ".concat(stories[_index2].title));
          getBalance();
          getStories();

        case 46:
          if (!e.target.className.includes("writeCommentbtn")) {
            _context8.next = 61;
            break;
          }

          _index3 = e.target.id;
          comment = prompt("write comment: ", "nice work");
          _context8.prev = 49;
          _context8.next = 52;
          return regeneratorRuntime.awrap(contract.methods.writeComment(_index3, comment).send({
            from: kit.defaultAccount
          }));

        case 52:
          _result3 = _context8.sent;
          _context8.next = 58;
          break;

        case 55:
          _context8.prev = 55;
          _context8.t3 = _context8["catch"](49);
          notification("\u26A0\uFE0F ".concat(_context8.t3, "."));

        case 58:
          notification("comment successful");
          getBalance();
          getStories();

        case 61:
          if (!e.target.className.includes("viewCommentbtn")) {
            _context8.next = 75;
            break;
          }

          _index4 = e.target.id;
          _context8.prev = 63;
          _context8.next = 66;
          return regeneratorRuntime.awrap(contract.methods.viewComment(_index4).send({
            from: kit.defaultAccount
          }));

        case 66:
          _result4 = _context8.sent;
          _context8.next = 72;
          break;

        case 69:
          _context8.prev = 69;
          _context8.t4 = _context8["catch"](63);
          notification("\u26A0\uFE0F ".concat(_context8.t4, "."));

        case 72:
          notification("retriving comments");
          getBalance();
          getStories();

        case 75:
          if (!e.target.className.includes("deleteStorybtn")) {
            _context8.next = 89;
            break;
          }

          _index5 = e.target.id;
          _context8.prev = 77;
          _context8.next = 80;
          return regeneratorRuntime.awrap(contract.methods.eraseStory(_index5).send({
            from: kit.defaultAccount
          }));

        case 80:
          _result5 = _context8.sent;
          notification("you deleted ".concat(stories[_index5].title));
          _context8.next = 87;
          break;

        case 84:
          _context8.prev = 84;
          _context8.t5 = _context8["catch"](77);
          notification("\u26A0\uFE0F ".concat(_context8.t5, "."));

        case 87:
          getBalance();
          getStories();

        case 89:
          if (!e.target.className.includes("supportbtn")) {
            _context8.next = 114;
            break;
          }

          _index6 = e.target.id;
          amount = new _bignumber["default"](prompt("How much do you wish to donate (cUSD):", "1")).shiftedBy(ERC20_DECIMALS).toString();
          notification("⌛ Waiting for payment approval...");
          _context8.prev = 93;
          _context8.next = 96;
          return regeneratorRuntime.awrap(approve(amount));

        case 96:
          _context8.next = 101;
          break;

        case 98:
          _context8.prev = 98;
          _context8.t6 = _context8["catch"](93);
          notification("\u26A0\uFE0F ".concat(_context8.t6, "."));

        case 101:
          notification("\u231B processing payment ");
          _context8.prev = 102;
          _context8.next = 105;
          return regeneratorRuntime.awrap(contract.methods.support(_index6, amount).send({
            from: kit.defaultAccount
          }));

        case 105:
          _result6 = _context8.sent;
          notification("\uD83C\uDF89 You successfully donated");
          getStories();
          getBalance();
          _context8.next = 114;
          break;

        case 111:
          _context8.prev = 111;
          _context8.t7 = _context8["catch"](102);
          notification("\u26A0\uFE0F ".concat(_context8.t7, "."));

        case 114:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[6, 12], [20, 27], [34, 40], [49, 55], [63, 69], [77, 84], [93, 98], [102, 111]]);
});