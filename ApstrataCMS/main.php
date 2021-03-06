<?php

	date_default_timezone_set('Etc/GMT-5');
	
	require_once 'manage/cms.php';
	require_once 'manage/testData.php';
	global $pageId, $config;
	if (isset($_GET['pageId'])){
	   $pageId = $_GET['pageId'];
	}
	
	$cms = new CMS($config, $pageId);

	if ($GLOBALS["config"]["cachingHeaders"]) {
		// calc an offset of 1 hour
		$offset = $GLOBALS["config"]["cachingAge"] * 1;
		// calc the string in GMT not localtime and add the offset
		$expire = "Expires: " . gmdate("D, d M Y H:i:s", time() + $offset) . " GMT";
		//output the HTTP header
		Header($expire);
		Header("Cache-Control: max-age=" . $GLOBALS["config"]["cachingAge"] . ", must-revalidate");
	} 

	switch ($pageId) {
		
		case "test":
			include('manage/test.php');
			break;

		case "register":
			$page = array (
				"template" => $pageId,
				"title" => "Account registration",
				"apsdb.creationTime" => "",
				 "apsdb.lastModifiedTime" =>""
			);
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
			break;
			
		case "dashboard":
			$page = array (
				"template" => $pageId,
				"title" => "Account dashboard",
				"apsdb.creationTime" => "",
				 "apsdb.lastModifiedTime" =>""
			);
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
			break;

		case "login":
			$page = array (
				"template" => $pageId,
				"title" => "User Login",
				"apsdb.creationTime" => "",
				 "apsdb.lastModifiedTime" =>""
			);
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
			break;
			
		case "processingReg":
			$page = array (
				"template" => $pageId,
				"title" => "Processing Registration",
				"apsdb.creationTime" => "",
				 "apsdb.lastModifiedTime" =>""
			);
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
			break;
		case "summary":
			$page = array (
				"title" => "API Summary",
				"template" => $pageId,
				"summaryMode" => "true"
			);
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
			break;
		case "wikiProxy":
			$page = array (
				"template" => $pageId,
				"title" => "Wiki Proxy",
				"apsdb.creationTime" => "",
				 "apsdb.lastModifiedTime" =>""
			);
			include($GLOBALS["config"]["docroot"] . "/" . $GLOBALS["config"]["cmsBasePath"] . "/manage/wikiProxy.php");
			break;
		case null:
		case "":
		case "/":
			$pageId = "home";
		default:
			$page = $cms->getPage($pageId);
			if ($page['template'] == "pageNotFound" || $page['template'] == "internalError") {
				$page = array (
					"template" => $pageId,
					"title" => "",
					"apsdb.creationTime" => "",
					 "apsdb.lastModifiedTime" =>""
				);
			}
			
			include($GLOBALS["config"]["docroot"] . "/" . "templates/". $config['template'] . "/default.php");
	}
?>
