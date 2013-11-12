/*!
 * Add to Homescreen v2.0.11 ~ Copyright (c) 2013 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
var addToHome = (function (w) {
  var nav = w.navigator,
		isIDevice = 'platform' in nav && (/iphone|ipod|ipad/gi).test(nav.platform),
		isIPad,
		isRetina,
		isSafari,
		isStandalone,
		OSVersion,
		startX = 0,
		startY = 0,
		lastVisit = 0,
		isExpired,
		isSessionActive,
		isReturningVisitor,
		balloon,
		overrideChecks,

		positionInterval,
		closeTimeout,

		options = {
			autostart: true,			// Automatically open the balloon
			returningVisitor: false,	// Show the balloon to returning visitors only (setting this to true is highly recommended)
			animationIn: 'drop',		// drop || bubble || fade
			animationOut: 'fade',		// drop || bubble || fade
			startDelay: 3000,			// 2 seconds from page load before the balloon appears
			lifespan: 30000,			// 15 seconds before it is automatically destroyed
			bottomOffset: 14,			// Distance of the balloon from bottom
			expire: 0,					// Minutes to wait before showing the popup again (0 = always displayed)
			message: '',				// Customize your message or force a language ('' = automatic)
			touchIcon: false,			// Display the touch icon
			arrow: true,				// Display the balloon arrow
			hookOnLoad: true,			// Should we hook to onload event? (really advanced usage)
			closeButton: true,			// Let the user close the balloon
			iterations: 100				// Internal/debug use
		},

		intl = {
			ar:    '<span dir="rtl">قم بتثبيت هذا التطبيق على <span dir="ltr">%device:</span>انقر<span dir="ltr">%icon</span> ،<strong>ثم اضفه الى الشاشة الرئيسية.</strong></span>',
			ca_es: 'Per instal·lar aquesta aplicació al vostre %device premeu %icon i llavors <strong>Afegir a pantalla d\'inici</strong>.',
			cs_cz: 'Pro instalaci aplikace na Váš %device, stiskněte %icon a v nabídce <strong>Přidat na plochu</strong>.',
			da_dk: 'Tilføj denne side til din %device: tryk på %icon og derefter <strong>Føj til hjemmeskærm</strong>.',
			de_de: 'Installieren Sie diese App auf Ihrem %device: %icon antippen und dann <strong>Zum Home-Bildschirm</strong>.',
			el_gr: 'Εγκαταστήσετε αυτήν την Εφαρμογή στήν συσκευή σας %device: %icon μετά πατάτε <strong>Προσθήκη σε Αφετηρία</strong>.',
			en_us: 'Install this web app on your %device: tap %icon and then <strong>Add to Home Screen</strong>.',
			es_es: 'Para instalar esta app en su %device, pulse %icon y seleccione <strong>Añadir a pantalla de inicio</strong>.',
			fi_fi: 'Asenna tämä web-sovellus laitteeseesi %device: paina %icon ja sen jälkeen valitse <strong>Lisää Koti-valikkoon</strong>.',
			fr_fr: 'Ajoutez cette application sur votre %device en cliquant sur %icon, puis <strong>Ajouter à l\'écran d\'accueil</strong>.',
			he_il: '<span dir="rtl">התקן אפליקציה זו על ה-%device שלך: הקש %icon ואז <strong>הוסף למסך הבית</strong>.</span>',
			hr_hr: 'Instaliraj ovu aplikaciju na svoj %device: klikni na %icon i odaberi <strong>Dodaj u početni zaslon</strong>.',
			hu_hu: 'Telepítse ezt a web-alkalmazást az Ön %device-jára: nyomjon a %icon-ra majd a <strong>Főképernyőhöz adás</strong> gombra.',
			it_it: 'Installa questa applicazione sul tuo %device: premi su %icon e poi <strong>Aggiungi a Home</strong>.',
			ja_jp: 'このウェブアプリをあなたの%deviceにインストールするには%iconをタップして<strong>ホーム画面に追加</strong>を選んでください。',
			ko_kr: '%device에 웹앱을 설치하려면 %icon을 터치 후 "홈화면에 추가"를 선택하세요',
			nb_no: 'Installer denne appen på din %device: trykk på %icon og deretter <strong>Legg til på Hjem-skjerm</strong>',
			nl_nl: 'Installeer deze webapp op uw %device: tik %icon en dan <strong>Voeg toe aan beginscherm</strong>.',
			pl_pl: 'Aby zainstalować tę aplikacje na %device: naciśnij %icon a następnie <strong>Dodaj jako ikonę</strong>.',
			pt_br: 'Instale este aplicativo em seu %device: aperte %icon e selecione <strong>Adicionar à Tela Inicio</strong>.',
			pt_pt: 'Para instalar esta aplicação no seu %device, prima o %icon e depois em <strong>Adicionar ao ecrã principal</strong>.',
			ru_ru: 'Установите это веб-приложение на ваш %device: нажмите %icon, затем <strong>Добавить в «Домой»</strong>.',
			sv_se: 'Lägg till denna webbapplikation på din %device: tryck på %icon och därefter <strong>Lägg till på hemskärmen</strong>.',
			th_th: 'ติดตั้งเว็บแอพฯ นี้บน %device ของคุณ: แตะ %icon และ <strong>เพิ่มที่หน้าจอโฮม</strong>',
			tr_tr: 'Bu uygulamayı %device\'a eklemek için %icon simgesine sonrasında <strong>Ana Ekrana Ekle</strong> düğmesine basın.',
			uk_ua: 'Встановіть цей веб сайт на Ваш %device: натисніть %icon, а потім <strong>На початковий екран</strong>.',
			zh_cn: '您可以将此应用程式安装到您的 %device 上。请按 %icon 然后点选<strong>添加至主屏幕</strong>。',
			zh_tw: '您可以將此應用程式安裝到您的 %device 上。請按 %icon 然後點選<strong>加入主畫面螢幕</strong>。'
		};

	function init () {
		// Preliminary check, all further checks are performed on iDevices only
		if ( !isIDevice ) return;

		var now = Date.now(),
			i;

		// Merge local with global options
		if ( w.addToHomeConfig ) {
			for ( i in w.addToHomeConfig ) {
				options[i] = w.addToHomeConfig[i];
			}
		}
		if ( !options.autostart ) options.hookOnLoad = false;

		isIPad = (/ipad/gi).test(nav.platform);
		isRetina = w.devicePixelRatio && w.devicePixelRatio > 1;
		isSafari = (/Safari/i).test(nav.appVersion) && !(/CriOS/i).test(nav.appVersion);
		isStandalone = nav.standalone;
		OSVersion = nav.appVersion.match(/OS (\d+_\d+)/i);
		OSVersion = OSVersion && OSVersion[1] ? +OSVersion[1].replace('_', '.') : 0;

		lastVisit = +w.localStorage.getItem('addToHome');

		isSessionActive = w.sessionStorage.getItem('addToHomeSession');
		isReturningVisitor = options.returningVisitor ? lastVisit && lastVisit + 28*24*60*60*1000 > now : true;

		if ( !lastVisit ) lastVisit = now;

		// If it is expired we need to reissue a new balloon
		isExpired = isReturningVisitor && lastVisit <= now;

		if ( options.hookOnLoad ) w.addEventListener('load', loaded, false);
		else if ( !options.hookOnLoad && options.autostart ) loaded();
	}

	function loaded () {
		w.removeEventListener('load', loaded, false);

		if ( !isReturningVisitor ) w.localStorage.setItem('addToHome', Date.now());
		else if ( options.expire && isExpired ) w.localStorage.setItem('addToHome', Date.now() + options.expire * 60000);

		if ( !overrideChecks && ( !isSafari || !isExpired || isSessionActive || isStandalone || !isReturningVisitor ) ) return;

		var touchIcon = '',
			platform = nav.platform.split(' ')[0],
			language = nav.language.replace('-', '_');

		balloon = document.createElement('div');
		balloon.id = 'addToHomeScreen';
		balloon.style.cssText += 'left:-9999px;-webkit-transition-property:-webkit-transform,opacity;-webkit-transition-duration:0;-webkit-transform:translate3d(0,0,0);position:' + (OSVersion < 5 ? 'absolute' : 'fixed');

		// Localize message
		if ( options.message in intl ) {		// You may force a language despite the user's locale
			language = options.message;
			options.message = '';
		}
		if ( options.message === '' ) {			// We look for a suitable language (defaulted to en_us)
			options.message = language in intl ? intl[language] : intl['en_us'];
		}

		if ( options.touchIcon ) {
			touchIcon = isRetina ?
				document.querySelector('head link[rel^=apple-touch-icon][sizes="114x114"],head link[rel^=apple-touch-icon][sizes="144x144"],head link[rel^=apple-touch-icon]') :
				document.querySelector('head link[rel^=apple-touch-icon][sizes="57x57"],head link[rel^=apple-touch-icon]');

			if ( touchIcon ) {
				touchIcon = '<span style="background-image:url(' + touchIcon.href + ')" class="addToHomeTouchIcon"></span>';
			}
		}

		balloon.className = (OSVersion >=7 ? 'addToHomeIOS7 ' : '') + (isIPad ? 'addToHomeIpad' : 'addToHomeIphone') + (touchIcon ? ' addToHomeWide' : '');
		balloon.innerHTML = touchIcon +
			options.message.replace('%device', platform).replace('%icon', OSVersion >= 4.2 ? '<span class="addToHomeShare"></span>' : '<span class="addToHomePlus">+</span>') +
			(options.arrow ? '<span class="addToHomeArrow"' + (OSVersion >= 7 && isIPad && touchIcon ? ' style="margin-left:-32px"' : '') + '></span>' : '') +
			(options.closeButton ? '<span class="addToHomeClose">\u00D7</span>' : '');

		document.body.appendChild(balloon);

		// Add the close action
		if ( options.closeButton ) balloon.addEventListener('click', clicked, false);

		if ( !isIPad && OSVersion >= 6 ) window.addEventListener('orientationchange', orientationCheck, false);

		setTimeout(show, options.startDelay);
	}

  var addedCSS = false;
  function addCSS(){
    if(addedCSS) return;
    addedCSS = true;
    $("body").append("<style>"+
    "#addToHomeScreen{z-index:9999;width:240px;font-size:15px;padding:12px 14px;text-align:left;line-height:28px;background:#ebf0f0;box-shadow:0 0 4px rgba(0,0,0,0.5)}#addToHomeScreen.addToHomeIOS7{border:1px solid #ccc}#addToHomeScreen.addToHomeIOS7 .addToHomeArrow{border-color:#ccc !important}#addToHomeScreen.addToHomeIOS7 .addToHomeClose{line-height:12px;padding-right:1px;background:transparent;border:1px solid #888}#addToHomeScreen.addToHomeIOS7 .addToHomeShare{width:11px;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAA8CAYAAAAQTCjdAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAASCQAAEgkB80sG3AAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKjSURBVGiB7dpPiFVVHMDxz7m9NCtMyI2bEJEC25WrEkzHUXCRraIwdNE8ZxfYIlcis1ZEbGEzT1QCF4XgH1CyWhUoJKIWNRGEiCNKmkSiYTzfcfGuOokx77x3ZlS8382959zfn+/invvn3RdijHIRBrwkOINCYXEcdjpb7VyiYdBsLScwt5y6IloYdzqXo36Ro0gY9IKWo+5JwmzBt2HQnBw9ehYNazyn5TBee8Dh+Vq+CWu92GufnkTDR6ab7gDeBNHouMM/l9tXTXM0fGBmL726Fg1Dam74EsvKqR8VNowL2Yzj5f7rnnE4DHq2235diYYhhTGfC94up35T0y+6di/ITU0rKVd+sEi0P7xr2pSJOu8zvF+OzqEv7vDH/WFxt7/cshy/ticsN8sXYUht0kXDOlsF9XJ4UaEvNoz9X3zc5bKaZThbyr5jzJ4wlNY7KTgM+ES0vhz+KeiPw36fKC/ucAF9uFBOrTZm26SJCtaV27+xIo7cXdkTEhvOoh+XyxprU1qnim7CQdGK2HAyKRexYVShT3RItDElN+mkjiP2Ym+S3f01hv2EVal5WW6hU0ElmptaqJuBpXg6MbeFH2LDpU6CQ93zWIKnEvs0cayGU3glMfkOo1jQYewZzOuyz7FC95Jwo5OgUFfgeg993hh/eTqCTxOSm/iuk8DY0Ap1b2GhtHXxsfZN4j/X0fOx4auEIknEhqv4OiUn1L13Z/+xWfWVaG4q0dxUormpRHNTieamEs1NJZqbJ1Q0jHvdiJo5S2cVjSNOCHZhn3/SnuYnIvl3yomIIz7MXZMn9hydRCrR3FSiualEc1OJ5qYSzU0lmptKNDePjWgwcPePT7/g+4cp8wCW4GXaryK3tL+mLdD5x62ppllgu7bso8q/2HIbzGWdNmWnSJwAAAAASUVORK5CYII=);background-size:11px 15px}#addToHomeScreen.addToHomeIpad{width:268px;font-size:18px;padding:14px}#addToHomeScreen.addToHomeIpad .addToHomeArrow{-webkit-transform:rotateZ(-135deg);top:-9px;bottom:auto;left:50%}#addToHomeScreen.addToHomeWide{width:296px}#addToHomeScreen.addToHomeIpad.addToHomeWide{width:320px;font-size:18px;padding:14px}#addToHomeScreen .addToHomeArrow{position:absolute;border-width:0 1px 1px 0;border-style:solid;border-color:#505050;width:16px;height:16px;-webkit-transform:rotateZ(45deg);bottom:-9px;left:50%;margin-left:-8px;-webkit-box-shadow:inset -1px -1px 0 #a9a9a9;-webkit-border-bottom-right-radius:2px}#addToHomeScreen .addToHomeArrow{position:absolute;border-width:0 1px 1px 0;border-style:solid;border-color:#505050;width:16px;height:16px;-webkit-transform:rotateZ(45deg);bottom:-9px;left:50%;margin-left:-8px;background:#ebf0f0;-webkit-box-shadow:inset -1px -1px 0 #a9a9a9;-webkit-border-bottom-right-radius:2px}#addToHomeScreen .addToHomeClose{-webkit-box-sizing:border-box;position:absolute;right:4px;top:4px;width:18px;height:18px;line-height:14px;text-align:center;text-indent:1px;-webkit-border-radius:9px;background:rgba(0,0,0,0.12);color:#888;-webkit-box-shadow:0 1px 0 #fff;font-size:16px}#addToHomeScreen .addToHomePlus{font-weight:bold;font-size:1.3em}#addToHomeScreen .addToHomeShare{display:inline-block;width:18px;height:15px;background-repeat:no-repeat;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAeCAQAAADu6HTYAAADPElEQVR4Xq3TX2gcRRzA8e/M7mVv2+TSNpc/TZtrY6jUGqgaSAmEChKLrYK0YH0RFC2CSCkEfCghiKU04J8qNigq6os+iQV98MHWFwVBrQQRWs21lBw5cw3NNb1/udu72RGG5Y77IzXW77D7sAwf5scyYoL6BGXSDKFZwaGpLvIUaeoCkvX1MmsM0Ny6oRSQYOLuIS+YZOpfQdqslpUxcZrzTVAz4qPwW2O3CeIwC/RSzeY6Ow1QhUrkr+YOWfEKDkEP8Rij7CHKJmrFSDHBdwGEE5wiGChPN+PnT8VdRtEIl1d4gRj/1EVe5ZSBKGh8iqQpo/Fo5+3C/gz0MYg4zgwbqday1/Q4B8BGQ45d/Hi54lakCrU5obOcidJpu1+Lg9whjabyaOYLnrIBFFaRD+xe2ybMDWY66GmP/WA9cGfGp0CWhy0wkMN8inepFiH2rV1j0NQSNQbFLRQnS8/8YSDBBpadfv4CYDub2fmeHDNAsL1MBWUel0iA+Xik6eHcyvD3vAMSU1TGuA/YRS+dD7ovCQN43GKRFCU20Kd3V/avDVVyAZ5niTEuLA5/zBGWg9EEEhfJKN200Tat8CmRAQb9+wv7soPlHt2tQorsz1uPbr0HTY4sJwrH47zJZwABBAKLMBoQXepwgTwdHCo+fXMkQ4lrxEmQ5AaXipPqDY9V2vn09tgvTPI71EEGYxM+/uMJLJ4svpgaWGKOi/xKgmqLSUGSUd5f2vIVJ/CgBaTIUsZ7ZBsn0+NzfMOXLFCXQyTcybN6ep5ZZgUOHn7jpfUpsZshdugPGf+E5zjbyHTSRyQ8xfRPPM/s63RHeuknSoT22mjmmnAOIMkUZ6D1xSfPPAfd1WFKM3sO2CMaHx8M1NjnXKHaAGGkOW0C02WeYHUz4qMtx+w5gUDS8NckYe5lHsMYwCZEPyEEmjLDZFmAS7CDviMdxyTkMNVBKEmYLvbiQQBIBBbCQG04bGQvFWz6CfsCQLWCigILFwcfkGYBiOpbYuOizTAyYyDdCtrGaRG1LCkIgMYEFhI0WqQZoSlbGRyHKe4qOx7iv2bVQW9dp4dlM/x6kmwnWQcd/Q3FCqwTEiT5s+6D5v/pb0SSHyg7uhMWAAAAAElFTkSuQmCC);background-size:18px 15px;text-indent:-9999em;overflow:hidden}#addToHomeScreen .addToHomeTouchIcon{display:block;float:left;-webkit-border-radius:6px;border-radius:6px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.5),inset 0 0 2px rgba(255,255,255,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.5),inset 0 0 2px rgba(255,255,255,0.9);background-repeat:no-repeat;width:57px;height:57px;-webkit-background-size:57px 57px;background-size:57px 57px;margin:0 12px 0 0;border:1px solid #333;-webkit-background-clip:padding-box;background-clip:padding-box}"
    +"</style>");
  }

	function show () {
		var duration,
			iPadXShift = 208;

    addCSS();
    
		// Set the initial position
		if ( isIPad ) {
			if ( OSVersion < 5 ) {
				startY = w.scrollY;
				startX = w.scrollX;
			} else if ( OSVersion < 6 ) {
				iPadXShift = 160;
			} else if ( OSVersion >= 7 ) {
				iPadXShift = 143;
			}

			balloon.style.top = startY + options.bottomOffset + 'px';
			balloon.style.left = Math.max(startX + iPadXShift - Math.round(balloon.offsetWidth / 2), 9) + 'px';

			switch ( options.animationIn ) {
				case 'drop':
					duration = '0.3s';
					balloon.style.webkitTransform = 'translate3d(0,' + -(w.scrollY + options.bottomOffset + balloon.offsetHeight) + 'px,0)';
					break;
				case 'bubble':
					duration = '0.3s';
					balloon.style.opacity = '0';
					balloon.style.webkitTransform = 'translate3d(0,' + (startY + 50) + 'px,0)';
					break;
				default:
					duration = '0.3s';
					balloon.style.opacity = '0';
			}
		} else {
			startY = w.innerHeight + w.scrollY;

			if ( OSVersion < 5 ) {
				startX = Math.round((w.innerWidth - balloon.offsetWidth) / 2) + w.scrollX;
				balloon.style.left = startX + 'px';
				balloon.style.top = startY - balloon.offsetHeight - options.bottomOffset + 'px';
			} else {
				balloon.style.left = '50%';
				balloon.style.marginLeft = -Math.round(balloon.offsetWidth / 2) - ( w.orientation%180 && OSVersion >= 6 && OSVersion < 7 ? 40 : 0 ) + 'px';
				balloon.style.bottom = options.bottomOffset + 'px';
			}

			switch (options.animationIn) {
				case 'drop':
					duration = '0.3s';
					balloon.style.webkitTransform = 'translate3d(0,' + -(startY + options.bottomOffset) + 'px,0)';
					break;
				case 'bubble':
					duration = '0.3s';
					balloon.style.webkitTransform = 'translate3d(0,' + (balloon.offsetHeight + options.bottomOffset + 50) + 'px,0)';
					break;
				default:
					duration = '0.3s';
					balloon.style.opacity = '0';
			}
		}

		balloon.offsetHeight;	// repaint trick
		balloon.style.webkitTransitionDuration = duration;
		balloon.style.opacity = '1';
		balloon.style.webkitTransform = 'translate3d(0,0,0)';
		balloon.addEventListener('webkitTransitionEnd', transitionEnd, false);

		closeTimeout = setTimeout(close, options.lifespan);
	}

	function manualShow (override) {
		if ( !isIDevice || balloon ) return;

		overrideChecks = override;
		loaded();
	}

	function close () {
		clearInterval( positionInterval );
		clearTimeout( closeTimeout );
		closeTimeout = null;

		// check if the popup is displayed and prevent errors
		if ( !balloon ) return;

		var posY = 0,
			posX = 0,
			opacity = '1',
			duration = '0';

		if ( options.closeButton ) balloon.removeEventListener('click', clicked, false);
		if ( !isIPad && OSVersion >= 6 ) window.removeEventListener('orientationchange', orientationCheck, false);

		if ( OSVersion < 5 ) {
			posY = isIPad ? w.scrollY - startY : w.scrollY + w.innerHeight - startY;
			posX = isIPad ? w.scrollX - startX : w.scrollX + Math.round((w.innerWidth - balloon.offsetWidth)/2) - startX;
		}

		balloon.style.webkitTransitionProperty = '-webkit-transform,opacity';

		switch ( options.animationOut ) {
			case 'drop':
				if ( isIPad ) {
					duration = '0.3s';
					opacity = '0';
					posY += 50;
				} else {
					duration = '0.3s';
					posY += balloon.offsetHeight + options.bottomOffset + 50;
				}
				break;
			case 'bubble':
				if ( isIPad ) {
					duration = '0.3s';
					posY -= balloon.offsetHeight + options.bottomOffset + 50;
				} else {
					duration = '0.3s';
					opacity = '0';
					posY -= 50;
				}
				break;
			default:
				duration = '0.3s';
				opacity = '0';
		}

		balloon.addEventListener('webkitTransitionEnd', transitionEnd, false);
		balloon.style.opacity = opacity;
		balloon.style.webkitTransitionDuration = duration;
		balloon.style.webkitTransform = 'translate3d(' + posX + 'px,' + posY + 'px,0)';
	}


	function clicked () {
		w.sessionStorage.setItem('addToHomeSession', '1');
		isSessionActive = true;
		close();
	}

	function transitionEnd () {
		balloon.removeEventListener('webkitTransitionEnd', transitionEnd, false);

		balloon.style.webkitTransitionProperty = '-webkit-transform';
		balloon.style.webkitTransitionDuration = '0.2s';

		// We reached the end!
		if ( !closeTimeout ) {
			balloon.parentNode.removeChild(balloon);
			balloon = null;
			return;
		}

		// On iOS 4 we start checking the element position
		if ( OSVersion < 5 && closeTimeout ) positionInterval = setInterval(setPosition, options.iterations);
	}

	function setPosition () {
		var matrix = new WebKitCSSMatrix(w.getComputedStyle(balloon, null).webkitTransform),
			posY = isIPad ? w.scrollY - startY : w.scrollY + w.innerHeight - startY,
			posX = isIPad ? w.scrollX - startX : w.scrollX + Math.round((w.innerWidth - balloon.offsetWidth) / 2) - startX;

		// Screen didn't move
		if ( posY == matrix.m42 && posX == matrix.m41 ) return;

		balloon.style.webkitTransform = 'translate3d(' + posX + 'px,' + posY + 'px,0)';
	}

	// Clear local and session storages (this is useful primarily in development)
	function reset () {
		w.localStorage.removeItem('addToHome');
		w.sessionStorage.removeItem('addToHomeSession');
	}

	function orientationCheck () {
		balloon.style.marginLeft = -Math.round(balloon.offsetWidth / 2) - ( w.orientation%180 && OSVersion >= 6 && OSVersion < 7 ? 40 : 0 ) + 'px';
	}

	// Bootstrap!
	init();

	return {
		show: manualShow,
		close: close,
		reset: reset
	};
})(window);
