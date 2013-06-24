<?php 

	require_once 'lib/APSDB/APSDBClient.php';
	require_once 'lib/APSDB/APSDBConfig.php';
	require_once 'util.php';
	require_once 'User.php';
	require_once 'LoginManager.php';
	
	$client = new APSDBClient(APSDBConfig::$ACCOUNT_KEY);
	$util = new Util();
			
	// verify if the request contains the key of a meal document or the document itself
	$key = $_REQUEST['key'];
	
	// if the request contains the key of a meal document, we need to retrive the document before
	// rendering the page
	$meal = null;
	if ($key != null) {
		
		$params = array();
		array_push($params, new KeyValue("key", $key));
		array_push($params, new KeyValue("apsdb.scriptName", "ftp.api.getMeal"));	
			
		$mealDocResp = $client->callApi("RunScript", $params);
		$meal = $mealDocResp["response"]["result"];
			
		// join the content of the ingredients array into a string
		$meal["ingredients"] = join(",", $meal["ingredients"]);
		
		// build the link to the image of the meal		
		$fileUrl = $util->getLinkToFile("pictures", $meal["pictures"], $key); 
		$meal["picture"] = $fileUrl;
	}else {
		
		// otherwise, the meal data is already available in the request as a JSON object
		$mealStr = $_REQUEST['meal'];
		$meal = json_decode($mealStr, true);
	}
	
	$user = LoginManager::handleUser();	
?>
<html>
	<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#<?php print util::$APP_NAMESPACE?>: http://ogp.me/ns/fb/<?php print util::$APP_NAMESPACE?>#">
		<meta property="fb:app_id" content="<?php print util::$APP_KEY?>"/>
		<meta property="og:type" content="<?php print util::$APP_NAMESPACE?>:meal"/>		
  		<meta property="og:title" content="<?php print $meal['recipeName']?>"/>
 		<meta property="og:image" content="<?php print $meal['picture']?>"/>
 		<link rel="stylesheet" type="text/css" href="./css/style.css"/>
		<link rel="stylesheet" type="text/css" href="./css/bootstrap.min.css"/>
		<script type="text/javascript">
	
			// this function invokes the Apstrata script that handles the login process
			function facebookLogin() {
				
				var url = "<?php print APSDBConfig::$SERVICE_URL . '/' . APSDBConfig::$ACCOUNT_KEY?>/RunScript?";
				url = url + "apsws.time=" + new Date().getTime() + "&apsws.responseType=jsoncdp";
				url = url + "&apsdb.scriptName=social.api.facebookLogin&redirectAfterLogin=true&";
				url = url + "loggedInRedirectUrl=" + encodeURIComponent("<?php print Util::$WEB_URL?>/getMeal.php");
				<?php 
					if ($key != null) {
						print 'url = url + "?key=' . $key . '";';	
					}
				?>
				url = url + "&returnApstrataToken=true";
				window.location.assign(url);	
			}
		</script>
		<script type="text/javascript" src="publishFBAction.js"></script> 
 	</head>	
	<div class="navbar navbar-inverse navbar-fixed-top">
	  <div class="navbar-inner">
	    <div class="container-fluid">
	      <a class="brand" href="<?php Util::$WEB_URL?>/listMeals.php">Meals with Friends</a>
	      <p id="user-identity" class="navbar-text pull-right">
      	<?php     	
      		
      		if ($user == null && $isApstrataTokenValid == false ) {
      	?>
      			<button id="login-button" class="btn btn-primary" type="button" onclick="facebookLogin()">Login</button>
      	<?php }
      		
      		if ($user != null) {
      	?>	
		    	<img width="25" height="25" alt="<?php print $user->getName()?>" src="<?php print $user->getPicture()?>">
				<span class="hidden-phone"><?php print $user->getName()?></span>
				<button id="logout-button" type="button" class="btn btn-primary" onclick="window.open('<?php print Util::$WEB_URL . '/logout.php?paramString=' . urlencode('getMeal.php?key=' . $key)?>', '_self')">Logout</button>		
      	<?php
      		}      			
      	?>
      </p>
	    </div>
	  </div>
	</div>
	<body>		
		<div class="container-fluid">	
		<section id="meal" class="meal row-fluid" data-meal="<?php print $meal['recipeName']?>" data-mealtitle="<?php print $meal['recipeName']?>" role="main">
		  <div class="span4 thumbnail img-container"><img alt="<?php print $meal['recipeName']?>" src="<?php print $meal['picture']?>"/></div>
		  <div class="span8">
		    <header>
		      <h1><?php print $meal['recipeName']?></h1>
		      <p class="lead"><?php print $meal['description']?></p>
		    </header>
		
		    <p id="ingredients">Ingredients: <?php print $meal['ingredients']?></p>
		
		    <div id="social-actions">
		    <?php
		    	if ($user != null) {
		    ?>
		    	<button class="btn" id="share-button" type="button" onclick="publishAction('<?php print $key?>')">I ate this!</button>
		    <?php } ?> 
		    </div>
		  </div>
		</section>	
		</div><!--/.fluid-container-->
	</body>
</html>