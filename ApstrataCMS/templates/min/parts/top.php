		<div class='sideButton'><a href='http://wiki.apstrata.com/display/doc/Apstrata+CMS' target='_googleCode'>fork this site from google code</a></div>

		<div id='header'>
			<div class='contentFrame'>
				<div id='header-inner'>
					<a href="<?php echo $cms->getUrl('/'); ?>" id='logo'></a>
					<div id='menu'>
<?php
		foreach ($menu["menuPhp"] as $menuItem) {
?>
						<div class='menu-item'>
							<?php echo $cms->getLink($menuItem) ?>
						</div>
<?php
		}
?>
					</div>
				</div>
			</div>
		</div>