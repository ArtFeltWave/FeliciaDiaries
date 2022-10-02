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

contract DiaryHaven {
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    uint private numberOfStories = 0;

    struct MyStory {
        address payable owner;
        string title;
        string imageLink;
        string description;
        uint numOfLikes;
        Comment[] comments;
        uint supportedBy;
        uint supportAmount;
    }

    struct Comment {
        address user;
        string comment;
    }

    mapping(uint => MyStory) private stories;
    mapping(uint => bool) private exists;
    // keeps track of stories a user has liked
    mapping(uint => mapping(address => bool)) private _liked;

    /// @dev checks if caller is the story's owner
    modifier checkIfOwner(uint _index) {
        require(
            stories[_index].owner == msg.sender,
            "Owner only functionality"
        );
        _;
    }
    /// @dev checks if caller is not the story's owner
    modifier checkIfNotOwner(uint _index) {
        require(
            stories[_index].owner != msg.sender,
            "Viewer only functionality"
        );
        _;
    }
    /// @dev checks if the inputs to create/edit a story are valid
    modifier checkData(
        string calldata _title,
        string memory _imageLink,
        string memory _description
    ) {
        require(bytes(_title).length >= 1, "Title should be at least 1 word");
        require(bytes(_imageLink).length > 0, "empty Image Url");
        require(
            bytes(_description).length > 3,
            "Description should contain at least 3 words"
        );
        _;
    }
    /// @dev checks if story with id _index exists
    modifier exist(uint _index) {
        require(exists[_index], "Event does not exist");
        _;
    }

    /// @dev allow users to add a story to the platform
    function writeStory(
        string calldata _title,
        string calldata _imageLink,
        string calldata _description
    ) public checkData(_title, _imageLink, _description) {
        MyStory storage myStory = stories[numberOfStories];
        myStory.owner = payable(msg.sender);
        myStory.title = _title;
        myStory.imageLink = _imageLink;
        myStory.description = _description;
        exists[numberOfStories] = true;
        numberOfStories++;
    }
    /// @dev allow story owners to edit their story
    function editStory(
        uint _index,
        string calldata _title,
        string calldata _imageLink,
        string calldata _description
    )
        public
        exist(_index)
        checkIfOwner(_index)
        checkData(_title, _imageLink, _description)
    {
        MyStory storage currentStory = stories[_index];
        currentStory.title = _title;
        currentStory.imageLink = _imageLink;
        currentStory.description = _description;
    }

    /// @dev allow story owners to delete a story from the platform
    /// @notice story with _index will become inaccessible
    function eraseStory(uint _index) public exist(_index) checkIfOwner(_index) {
        delete (stories[_index]);
        exists[_index] = false;
    }

    function readStory(uint _index)
        public
        view
        exist(_index)
        returns (MyStory memory)
    {
        return (stories[_index]);
    }

    /**
     * @dev allow users to like a story
     * @notice Users can like a story only once
     */
    function likeStory(uint _index)
        public
        exist(_index)
        checkIfNotOwner(_index)
    {
        require(!_liked[_index][msg.sender], "You have already liked story");
        _liked[_index][msg.sender] = true;
        stories[_index].numOfLikes++;
    }
    /**
     * @dev allow users to dislike a story they have previously liked
     */
    function dislikeStory(uint _index)
        public
        exist(_index)
        checkIfNotOwner(_index)
    {
        require(_liked[_index][msg.sender], "You haven't liked this story");
        _liked[_index][msg.sender] = false;
        stories[_index].numOfLikes--;
    }
    /**
     * @dev allow users to comment on a story
     */
    function writeComment(uint _index, string calldata _comment)
        public
        exist(_index)
    {
        stories[_index].comments.push(Comment(msg.sender, _comment));
    }
    /**
     * @dev allow users to support the owner of a story
     * @notice amount donated must be at least one CUSD 
     */
    function support(uint _index, uint _amount)
        public
        payable
        exist(_index)
        checkIfNotOwner(_index)
    {
        require(_amount >= 1 ether, "Amount must be at least one cusd)");
        MyStory storage currentStory = stories[_index];
        currentStory.supportedBy++;
        uint newSupportAmount = currentStory.supportAmount + _amount;
        currentStory.supportAmount = newSupportAmount;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                currentStory.owner,
                _amount
            ),
            "Transfer failed."
        );
    }

    function viewStoriesLength() public view returns (uint) {
        return (numberOfStories);
    }
}
