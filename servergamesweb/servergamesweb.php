<html>

<head>
    <link rel="stylesheet" type="text/css" href="servergamesweb.css">
    </style>
</head>

<body onload="app.pageReady(window, 'appTemplate');">
    <template id="appTemplate">
        <inline-ajax get-once href="./ajax.php?t=userinfo" item="app.userInfo"></inline-ajax>
        <auto-selector item="app.drawerOpen" attribute-element="appLeftDrawerDiv" use-attribute="open"></auto-selector>
        <div id="appLeftDrawerDiv" class="flex-drawer" left-drawer>
            <div>General Chat</div>
        </div>
        <div class="header-container">
            <div class="header-title">
                <div class="back-button-container">
                    <click-div class="back-button" click-value="Home" click-mirror="Store" click-group="content" click-attribute="open"><span class="back-button-content">
                            <span><</span>
                    </click-div>
                </div>
                <div class="header-label">
                    <div>Stuff</div>
                </div>
                <menu-selector class="user-menu-button-container">
                    <template menu-button>
                        <div class="user-avatar-content">...</div>
                    </template>
                    <template menu-flyout>
                        <div class="flex-drawer" right-drawer>
                            <div class="drawer-contents">
                                <div class="user-avatar">
                                    <div class="user-avatar-content">[pic]</div>
                                </div>
                                <div id="userMenuContentDiv" class="user-menu-content">
                                    <item-div class="user-menu-username" item="app.userInfo" display-property="username"></item-div>
                                    <auto-selector class="user-menu-items-container" item="app.userInfo.isLoggedIn" active-element="userMenuItemsDiv" inactive-element="loginMenuDiv">
                                        <div id="userMenuItemsDiv" class="user-menu-items">
                                            <inline-repeat initial="Edit Profile,View Game Library,View Store,Log Out" text>
                                                <template item-template>
                                                    <click-div class="user-menu-item" click-group="user" click-value="{{text}}" click-attribute="open">
                                                        * <span item-target></span>
                                                    </click-div>
                                                </template>
                                            </inline-repeat>
                                        </div>
                                        <div id="loginMenuDiv" class="user-menu-items">
                                            <inline-repeat initial="Log In,Create User,View Store" text>
                                                <template item-template>
                                                    <click-div class="user-menu-item" click-group="user"
                                                        click-value="{{text}}" click-attribute="open">* <span
                                                            item-target></span></click-div>
                                                </template>
                                            </inline-repeat>
                                        </div>
                                    </auto-selector>
                                </div>
                            </div>
                        </div>
                    </template>
                </menu-selector>
            </div>
            <div class="header-tabs-wrapper">
                <click-div class="header-tabs hometab" click-group="content" click-default click-attribute="open" click-mirror="Home">
                    <inline-repeat in-line initial="Home,Games,Forum,About" text>
                        <template item-template>
                            <div class="header-tab-spacer"></div>
                            <click-div class="header-tab-item" click-value="{{text}}" click-group="main-tabs" click-attribute="selected">
                                <span item-target></span>
                            </click-div>
                        </template>
                        <template footer-template>
                            <div class="header-tab-spacer" end-cap>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="header-tabs storetab" click-group="content" click-mirror="Store">
                    <inline-repeat in-line initial="Newest,Popular,Trending,Oldest" text>
                        <template item-template>
                            <div class="header-tab-spacer"></div>
                            <click-div class="header-tab-item" click-value="{{text}}" click-group="store-tabs" click-attribute="selected">
                                <span item-target></span>
                            </click-div>
                        </template>
                        <template footer-template>
                            <div class="header-tab-spacer" end-cap>
                        </template>
                    </inline-repeat>
                </click-div>
            </div>

        </div>
        <div class="content-container-wrapper">
            <click-div class="content-container homediv" click-group="content" click-mirror="Home" click-default click-attribute="open" click-value="Home" id="mainContentDiv">
                <click-div class="tab-container" click-group="main-tabs" click-mirror="Home" click-default click-attribute="selected">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=homecards&w=new" items="app.homeCards">
                        <template progress>
                            <div class="spinner-div" active></div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat id="homeCardsRepeat" items="app.homeCards" initial="[]" alias="eachCard">
                        <template empty-template>
                            <div class="card-container">
                                <div class="card-content">Nothing to show!</div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachCard}}" display-property="text"></item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible href="./ajax.php?t=homecards&skip=${ app.homeCards.length }" items="app.homeCards">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="tab-container" click-group="main-tabs" click-mirror="Games">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=games" items="app.activeGames">
                        <template progress>
                            <div class="card-container">
                                <div class="card-content">
                                    <div class="spinner-div" active></div>
                                </div>
                            </div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat items="app.activeGames" initial="[]" alias="eachGame">
                        <template empty-template>
                            <div class="card-container">
                                <div id="nothingRunningDiv" class="card-content">Nothing is currently running</div>
                                <div id="notLoggedInGamesDiv" class="card-content">Log in to see if any games are running</div>
                                <auto-selector items="app.userInfo.isLoggedIn"  active-element="nothingRunningDiv" inactive-element="notLoggedInGamesDiv"></auto-selector>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachGame}}" display-property="name" href-property="joinUrl">
                                    </item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible href="./ajax.php?t=games&skip=${ app.activeGames.length }"
                                items="app.activeGames">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="tab-container" click-group="main-tabs" click-mirror="Forum">
                </click-div>
                <click-div class="tab-container" click-group="main-tabs" click-mirror="About">
                </click-div>
            </click-div>
            <click-div class="content-container storediv" click-group="content" click-mirror="Store" id="storeContentDiv" click-attribute="open" click-value="Store">
                <click-div class="tab-container" click-group="store-tabs" click-mirror="Newest" click-default
                    click-attribute="selected">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=store&w=new"
                        items="app.newestGames">
                        <template progress>
                            <div class="spinner-div" active></div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat id="newestGamesCardsRepeat" items="app.newestGames" initial="[]"
                        alias="eachCard">
                        <template empty-template>
                            <div class="card-container">
                                <div class="card-content">Nothing to show!</div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachCard}}" display-property="text"></item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible
                                href="./ajax.php?t=store&w=new&skip=${ app.newestGames.length }"
                                items="app.newestGames">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="tab-container" click-group="store-tabs" click-mirror="Popular">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=store&w=popular"
                        items="app.popularGames">
                        <template progress>
                            <div class="card-container">
                                <div class="card-content">
                                    <div class="spinner-div" active></div>
                                </div>
                            </div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat id="popularGamesCardsRepeat" items="app.popularGames" initial="[]"
                        alias="eachCard">
                        <template empty-template>
                            <div class="card-container">
                                <div class="card-content">Nothing to show!</div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachCard}}" display-property="text"></item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible
                                href="./ajax.php?t=store&w=popular&skip=${ app.popularGames.length }"
                                items="app.popularGames">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="tab-container" click-group="store-tabs" click-mirror="Trending">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=store&w=trending"
                        items="app.trendingGames">
                        <template progress>
                            <div class="card-container">
                                <div class="card-content">
                                    <div class="spinner-div" active></div>
                                </div>
                            </div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat id="trendingGamesCardsRepeat" items="app.trendingGames" initial="[]"
                        alias="eachCard">
                        <template empty-template>
                            <div class="card-container">
                                <div class="card-content">Nothing to show!</div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachCard}}" display-property="text"></item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible
                                href="./ajax.php?t=store&w=trending&skip=${ app.trendingGames.length }"
                                items="app.trendingGames">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div class="tab-container" click-group="store-tabs" click-mirror="Oldest">
                    <inline-ajax parent-trigger trigger-attribute="selected" href="./ajax.php?t=store&w=oldest"
                        items="app.oldestGames">
                        <template progress>
                            <div class="card-container">
                                <div class="card-content">
                                    <div class="spinner-div" active></div>
                                </div>
                            </div>
                        </template>
                        <template error>
                            <div class="card-container">
                                <div class="card-content">There was an error accessing the network.</div>
                            </div>
                        </template>
                    </inline-ajax>
                    <inline-repeat id="oldestGamesCardsRepeat" items="app.oldestGames" initial="[]"
                        alias="eachCard">
                        <template empty-template>
                            <div class="card-container">
                                <div class="card-content">Nothing to show!</div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template item-template>
                            <div class="card-container">
                                <div class="card-content">
                                    <item-div item="{{eachCard}}" display-property="text"></item-div>
                                </div>
                            </div>
                            <div class="card-spacer"></div>
                        </template>
                        <template footer-template>
                            <inline-ajax get-when-visible
                                href="./ajax.php?t=store&w=oldest&skip=${ app.oldestGames.length }"
                                items="app.oldestGames">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                </template>
                                <template error>
                                    <div class="card-container">
                                        <div class="card-content">There was an error accessing the network.</div>
                                    </div>
                                </template>
                            </inline-ajax>
                        </template>
                    </inline-repeat>
                </click-div>
                <click-div click-group="user" click-mirror="View Store">
                    <auto-selector parent-trigger trigger-attribute="open" activated-click="storeContentDiv"></auto-selector>
                </click-div>
            </click-div>
        </div>
        <click-div class="modal-container" click-group="user" click-mirror="Edit Profile" id="profileModalDiv" jibberish>
            <form class="modal-window" id="editProfileForm" method="post" action="ajax.php?t=editprofile">
                <click-div id="editProfileCloseButton" class="modal-close-button" click-value="X" click-group="user" click-attribute="open"><span item-target></span></click-div>
                <div class="modal-content">
                    <div class="modal-title">Edit Profile</div>
                    <div class="modal-body">
                        <div class="user-avatar">
                            <div class="user-avatar-content">[pic]</div>
                        </div>
                        <div class="modal-item">
                            User Name: <item-text-input type="text" name="username" item="app.changedUsername"><input id="editUsernameInput" item-target/></item-text-input>
                            <span id="checkUserSpinner" class="spinner-div"></span>

                            <auto-selector trigger-element="changePasswordButton" trigger-attribute="active"
                                on-trigger-statement="app.changedUsername = app.userInfo.username;"></auto-selector>
                        </div>
                            <inline-ajax href="ajax.php?t=usernamecheck&username=${ app.changedUsername }" blur-trigger="editUsernameInput" trigger-element="changePasswordButton" trigger-attribute="active">
                                <template progress>
                                    <auto-selector item="app.changedUsername" operator="!=" value-item="app.userInfo.username"
                                        inactive-element="editProfileButtons"></auto-selector>
                                    <auto-selector item="app.changedUsername" operator="!=" value-item="app.userInfo.username"
                                        use-attribute="active" active-element="checkUserSpinner"></auto-selector>
                                </template>
                                <template error>
                                    <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                    <auto-selector active inactive-element="editProfileButtons"></auto-selector>
                                </template>
                            </inline-ajax>
                        <click-div class="modal-item" click-group="password" click-mirror id="changePasswordButton">
                            <click-div class="action-button" click-value="Change Password" click-group="password" click-attribute="active"><span item-target></span></click-div>
                        </click-div>
                        <click-div class="modal-item" id="passwordEntryInput" click-group="password" click-mirror="Change Password">
                            Old Password: <item-text-input type="text" item="app.oldPassword"></item-text-input>
                        </click-div>
                        <div class="modal-item" id="newPasswordInput">
                            New Password: <item-text-input type="text" item="app.newPassword"></item-text-input>
                        </div>
                        <div class="modal-item" id="reEnterPasswordInput">
                            Re-enter Password: <item-text-input type="text" name="password" item="app.reEnteredPassword"></item-text-input>
                        </div>

                        <auto-selector item="app.oldPassword.length" active-element="newPasswordInput"></auto-selector>
                        <auto-selector item="app.newPassword.length" active-element="reEnterPasswordInput"></auto-selector>
                        <auto-selector trigger-element="profileModalDiv" trigger-attribute="open"
                            active-element="changePasswordButton" inactive-element="passwordEntryInput"
                            use-attribute="active"></auto-selector>
                        <auto-selector trigger-element="changePasswordButton" trigger-attribute="active"
                            on-trigger-statement="app.newPassword = ''; app.reEnteredPassword = ''; app.oldPassword = '';"
                            inactive-element="newPasswordInput"></auto-selector>
                        <auto-selector trigger-element="changePasswordButton" trigger-attribute="active"
                            inactive-element="reEnterPasswordInput"></auto-selector>

                        <div class="modal-item" id="passwordMatchDiv">
                            <div class="modal-warning">Password must match</div>
                        </div>
                        <auto-selector active item="app.newPassword" value-item="app.reEnteredPassword"
                            active-element="editConfirmButton" inactive-element="passwordMatchDiv"></auto-selector>

                        <div class="modal-item">
                            <inline-ajax from-form="editProfileForm" success-click-element="editProfileCloseButton" item="app.userInfo">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                    <auto-selector active inactive-element="editProfileButtons"></auto-selector>
                                </template>
                                <template error>
                                    <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                </template>
                            </inline-ajax>
                        </div>
                    </div>
                    <div id="editProfileButtons" class="action-buttons-container">
                        <input class="action-button" type="submit" value="Confirm" id="editConfirmButton">
                        <click-div class="action-button" click-value="Cancel" click-group="user" click-attribute="open">
                            <span item-target></span></click-div>
                    </div>
                </div>
            </form>
        </click-div>
        <click-div class="modal-container" click-group="user" click-mirror="Create User">
            <form class="modal-window" id="newUserForm" method="post" action="ajax.php?t=newuser">
                <click-div id="newUserCloseButton" class="modal-close-button" click-value="X" click-group="user"
                    click-attribute="open"><span item-target></span></click-div>
                <div class="modal-content">
                    <div class="modal-title">Create New User</div>
                    <div class="modal-body">
                        <div class="modal-item">
                            User Name: <item-text-input item="app.newUsername" type="text" name="username"><input id="newUsernameInput" item-target></item-text-input>
                            <span id="checkNewUserSpinner" class="spinner-div"></span>
                        </div>

                        <inline-ajax href="ajax.php?t=usernamecheck&username=${ app.newUsername }" blur-trigger="newUsernameInput">
                            <template progress>
                                <auto-selector active inactive-element="newUserButtons"></auto-selector>
                                <auto-selector active use-attribute="active" active-element="checkNewUserSpinner"></auto-selector>
                            </template>
                            <template error>
                                <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                <auto-selector active inactive-element="newUserButtons"></auto-selector>
                            </template>
                        </inline-ajax>

                        <div class="modal-item">
                            Password: <input type="text" name="password">
                        </div>
                        <div class="modal-item">
                            <inline-ajax from-form="newUserForm" success-click-element="newUserCloseButton" item="app.userInfo">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                    <auto-selector active inactive-element="newUserButtons"></auto-selector>
                                </template>
                                <template error>
                                    <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                </template>
                            </inline-ajax>
                        </div>
                    </div>
                    <div id="newUserButtons" class="action-buttons-container">
                        <input class="action-button" type="submit" value="Create">
                        <click-div class="action-button" click-value="Cancel" click-group="user" click-attribute="open"><span item-target></span></click-div>
                    </div>
                </div>
            </form>
        </click-div>
        <click-div class="modal-container" click-group="user" click-mirror="Log In">
            <form class="modal-window" id="loginForm" method="post" action="ajax.php?t=login">
                <click-div id="loginCloseButton" class="modal-close-button" click-value="X" click-group="user"
                    click-attribute="open"><span item-target></span></click-div>
                <div class="modal-content">
                    <div class="modal-title">Log In</div>
                    <div class="modal-body">
                        <div class="modal-item">
                            User Name: <input type="text" name="username">
                        </div>
                        <div class="modal-item">
                            Password: <input type="text" name="password">
                        </div>
                        <div class="modal-item">
                            <inline-ajax from-form="loginForm" success-click-element="loginCloseButton"
                                item="app.userInfo">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                    <auto-selector active inactive-element="loginButtonsDiv"></auto-selector>
                                </template>
                                <template error>
                                    <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                </template>
                            </inline-ajax>
                        </div>
                    </div>
                    <div id="loginButtonsDiv" class="action-buttons-container">
                        <input class="action-button" type="submit" value="Log In" primary>
                        <click-div class="action-button" click-value="Cancel" click-group="user" click-attribute="open">
                            <span item-target></span></click-div>
                    </div>
                </div>
            </form>
        </click-div>
        <click-div class="modal-container" click-group="user" click-mirror="Log Out">
            <form class="modal-window" id="logoutForm" method="post" action="ajax.php?t=logout">
                <click-div id="logoutCloseButton" class="modal-close-button" click-value="X" click-group="user"
                    click-attribute="open"><span item-target></span></click-div>
                <div class="modal-content">
                    <div class="modal-body">
                        <div class="modal-item">
                            <div>Really log out?</div>
                        </div>
                        <div class="modal-item">
                            <inline-ajax from-form="logoutForm" success-click-element="logoutCloseButton"
                                item="app.userInfo">
                                <template progress>
                                    <div class="spinner-div" active></div>
                                    <auto-selector active inactive-element="logoutButtonsDiv"></auto-selector>
                                </template>
                                <template error>
                                    <item-div class="modal-warning" value="{{errorText}}"></item-div>
                                </template>
                            </inline-ajax>
                        </div>
                    </div>
                    <div id="logoutButtonsDiv" class="action-buttons-container">
                        <input class="action-button" type="submit" value="Log Out" primary>
                        <click-div class="action-button" click-value="Cancel" click-group="user" click-attribute="open">
                            <span item-target></span></click-div>
                    </div>
                </div>
            </form>
        </click-div>
    </template>
    <template id="phpErrorTemplate">
        <div>PHP Had a boo boo!</div>
    </template>
</body>

<script type="module" src="./servergamesweb.js"></script>

</html>