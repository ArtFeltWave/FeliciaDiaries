// SPDX-License-Identifier: MIT

/// @dev solitity version.
pragma solidity >=0.7.0 <0.9.0; //this contract works for solidty version from 0.7.0 to less than 0.9.0

/**
* @dev REquired interface of an ERC20 compliant contract.
*/
interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

/**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address, uint256) external returns (bool);

 /**
     * @dev Transfers `tokenId` token from `from` to `to`
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);


    function totalSupply() external view returns (uint256);

/*
*@dev Returns the number of tokens in``owner``'s acount.
*/
    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

/*
*@dev Emitted when `tokenId` token is transferred from `from` to `to`.
*/
    event Transfer(address indexed from, address indexed to, uint256 value);

/*
*@dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
*/  
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract DiaryHaven{
    
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    uint private numberOfEvents = 0;

    struct MyStory{
        address payable owner;
        string title;
        string imageLink;
        string description;
        uint numOfLikes;
        uint numOfDislikes;
        string[] comments;
        uint numOfComments;
        uint supportedBy;
        uint supportAmount;
    }

    mapping(uint => MyStory) private stories;
    mapping(uint => bool) private exists;
    mapping(address => string) private UserComments;

    /// @dev checks if caller is the diary owner
    modifier checkIfOwner(uint _index) {
        require(stories[_index].owner == msg.sender, "Owner only functionality");
        _;
    }

    modifier validAmount(uint _amount) {
        require(_amount >= 1, "Price must be at least one cusd)");
        _;
    }

    modifier exist(uint _index) {
        require(exists[_index], "Event does not exist");
        _;
    } 

    function writeStory(
        string memory _title,
        string memory _imageLink,
        string memory _description
    ) public  {
        require(bytes(_title).length >=1, "Title should be at least 1 word");
        require(bytes(_imageLink).length >0, "empty Image Url");
        require(bytes(_description).length > 3, "Description should contain at least 3 words");
        uint _likes = 0;
        uint _dislikes = 0;
        uint _supportedBy = 0;
        uint _supportAmount = 0;
        uint _commentCount = 0;
        string[] memory _comments;

         stories[numberOfEvents] = MyStory(
            payable(msg.sender),
            _title,
            _imageLink,
            _description,
            _likes,
            _dislikes,
            _comments,
            _commentCount,
            _supportedBy,
            _supportAmount

        );
        exists[numberOfEvents] = true;
        numberOfEvents++;
    }

    function editStory(
        uint _index,
        string memory _title,
        string memory _imageLink,
        string memory _description) 
    public exist(_index) checkIfOwner(_index){
        require(bytes(_title).length >=1, "New title should be at least one word");
        require(bytes(_imageLink).length > 0, "New image url should not be empty");
        require(bytes(_description).length >1, "New description should contain at least 2 words");
        stories[_index].title = _title;
        stories[_index].imageLink = _imageLink;
        stories[_index].description = _description;
    }

    function eraseStory( uint _index) public 
    exist(_index) checkIfOwner(_index) {
        delete(stories[_index]);
        exists[_index] = false;
        numberOfEvents--;
    }

    function readStory(uint _index) public view 
    exist(_index) returns(
        MyStory memory
    ) {
        return(stories[_index]);
    }

    function likeStory(uint _index) public exist(_index){
        require(msg.sender != stories[_index].owner, "You cannot like your own Diary Event");
        stories[_index].numOfLikes++;
    } 
    
    function dislikeStory(uint _index) public exist(_index) {
        require(msg.sender != stories[_index].owner, "You cannot dislike your own Diary Event");
        stories[_index].numOfDislikes++;
    }

    function writeComment(uint _index, string memory _comment) 
    public exist(_index) {
        UserComments[msg.sender] = _comment;
        stories[_index].comments.push(_comment);
        stories[_index].numOfComments++;
    }

    function viewComments(uint _index) public view 
    exist(_index) returns(string[] memory){
        return(stories[_index].comments);
    }

    function support(uint _index, uint _amount) public payable 
    exist(_index) validAmount(_amount){
        require(msg.sender!=stories[_index].owner,"You cannot donate to yourself");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            stories[_index].owner,
            _amount
          ),
          "Transfer failed."
        );
        stories[_index].supportedBy++;
        stories[_index].supportAmount += _amount;
    }

    function viewEventLength() public view returns(uint) {
        return(numberOfEvents);
    }

}