import { AppLanguage, CommunityActivityType, SiteContributionType, StoreProductCategory } from '../types';

export interface LanguageOption {
  code: AppLanguage;
  shortCode: string;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'fr', shortCode: 'FR', nativeName: 'Français', englishName: 'French', dir: 'ltr' },
  { code: 'en', shortCode: 'EN', nativeName: 'English', englishName: 'English', dir: 'ltr' },
  { code: 'ar', shortCode: 'AR', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
];

export interface TranslationDictionary {
  language: {
    sectionTitle: string;
    sectionSubtitle: string;
    rtlBadge: string;
    ltrBadge: string;
    toastTitle: string;
    toastDesc: string;
    switchTooltip: string;
  };
  nav: {
    accueil: string;
    explorer: string;
    sorties: string;
    equipement: string;
    transports: string;
    safety: string;
    galerie: string;
    profil: string;
  };
  header: {
    tagline: string;
    offline: string;
    app: string;
    sos: string;
    galleryTooltip: string;
    privateChatTooltip: string;
    communityTooltip: string;
    notificationsTooltip: string;
    cartTooltip: string;
  };
  workspace: {
    explorer: string;
    professional: string;
    store: string;
    explorerSub: string;
    professionalSub: string;
    storeSub: string;
    switchTitle: string;
    backToExplorer: string;
    landscapeLabel: string;
    landscapeTooltip: string;
    landscapeAutoTitle: string;
    landscapeAutoDesc: string;
    proTabs: {
      dashboard: string;
      offers: string;
      bookings: string;
      profile: string;
    };
    storeTabs: {
      dashboard: string;
      catalog: string;
      rentals: string;
      orders: string;
      profile: string;
    };
  };
  common: {
    offlineBanner: string;
    free: string;
    seeAll: string;
    cancel: string;
    publish: string;
    close: string;
    connectGoogle: string;
    signIn: string;
    signOut: string;
    onlineLabel: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    statHikers: string;
    statParksCount: string;
    statParks: string;
    statMobileMoney: string;
    quickGps: string;
    quickShuttles: string;
    quickChecklist: string;
    quickSos: string;
    universeTitle: string;
    universeSubtitle: string;
    poleExpeditions: string;
    hubSubExpeditions: string;
    poleShuttles: string;
    hubSubShuttles: string;
    poleRental: string;
    hubSubGear: string;
    poleGuides: string;
    hubSubGuides: string;
    ecoTitle: string;
    ecoDesc: string;
    ecoPointsUnit: string;
    ecoCleanParks: string;
    ecoBadgesBtn: string;
    ecoJoinBtn: string;
    communityTitle: string;
    communityDesc: string;
    communityPostsUnit: string;
    communityPublishCommentBtn: string;
    communityChatBtn: string;
    rentalBadge: string;
    rentalVerified: string;
    rentalTitle: string;
    rentalDesc: string;
    rentalPickup: string;
    rentalCta: string;
    rentalChecklistBtn: string;
    rentalStoreCta: string;
    featuredTitle: string;
    organizerPrefix: string;
    bookCartBtn: string;
    shuttlesBannerTitle: string;
    shuttlesBannerDesc: string;
    allRoutesBtn: string;
    seatsUnit: string;
    galleryTitle: string;
    gallerySubtitle: string;
    galleryCta: string;
  };
  weather: {
    title: string;
    subtitle: string;
    liveTag: string;
    cachedTag: string;
    refreshTooltip: string;
    errorMsg: string;
    retryBtn: string;
    loadingText: string;
    feelsLike: string;
    humidity: string;
    wind: string;
    precip: string;
    forecast4Days: string;
    parkNames: Record<string, { name: string; shortName: string; region: string }>;
  };
  explorer: {
    title: string;
    subtitle: string;
    trackerBtn: string;
    offlineModeBtn: string;
    offlineModeActive: string;
    offlineManageBtn: string;
    offlineBarTitle: string;
    offlineBarHint: string;
    offlineSavedCount: string;
    offlineConsultBtn: string;
    offlineDownloadNowBtn: string;
    offlineMissingNotice: string;
    offlineLegendLabel: string;
    filterAll: string;
    filterMondah: string;
    filterIvindo: string;
    filterDenis: string;
    filterCristal: string;
    filterLoango: string;
    filterLope: string;
  };
  sorties: {
    title: string;
    subtitle: string;
    communityBtn: string;
    catAll: string;
    catPublic: string;
    catPrivate: string;
    catInstitutional: string;
    distance: string;
    elevation: string;
    duration: string;
    passBtn: string;
    validated: string;
  };
  equipement: {
    title: string;
    subtitle: string;
    cartBtn: string;
    shopTab: string;
    rentalTab: string;
    shopSearchPlaceholder: string;
    rentalSearchPlaceholder: string;
    viewCart: string;
    partnerStores: string;
    showAll: string;
    emptyProducts: string;
    officialBadge: string;
    stockLabel: string;
    outOfStock: string;
    pickup: string;
    delivery: string;
    addToCart: string;
    outOfStockShort: string;
    addedProductToast: string;
    addedRentalToast: string;
    cautionBannerTitle: string;
    cautionBannerDesc: string;
    checklistBtn: string;
    perDay: string;
    availableSuffix: string;
    full: string;
    pickupLabel: string;
    durationLabel: string;
    daysUnit: string;
    depositLabel: string;
    unavailable: string;
    rentLabel: string;
    categories: Record<'all' | StoreProductCategory, string>;
  };
  transports: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterBus: string;
    filter4x4: string;
    filterBoat: string;
    safetyTitle: string;
    safetyDesc: string;
    rentalTitle: string;
    rentalDesc: string;
    rentBtn: string;
    perPerson: string;
    fleetTitle: string;
    openSeatsLabel: string;
    avgOccupancyLabel: string;
    liveOccupancy: string;
    seatsBookedLabel: string;
    seatsFreeLabel: string;
    statusAvailable: string;
    statusFillingFast: string;
    statusLastSeats: string;
    statusFull: string;
    meetingPoint: string;
    destinationLabel: string;
    departureLabel: string;
    returnLabel: string;
    driverLabel: string;
    alertH1: string;
    addCartBtn: string;
    reserveBtn: string;
    emptyFilterTitle: string;
    resetFilterBtn: string;
  };
  safety: {
    title: string;
    subtitle: string;
    beaconKicker: string;
    beaconTitle: string;
    beaconDesc: string;
    beaconBtn: string;
    activeIncidentsTitle: string;
    verifiedAnpn: string;
    userReport: string;
    reportedAt: string;
  };
  profile: {
    cloudActive: string;
    cloudActiveDesc: string;
    cloudInactive: string;
    cloudInactiveDesc: string;
    metricKm: string;
    metricAscent: string;
    metricSteps: string;
    appearanceTitle: string;
    modeAuto: string;
    modeDark: string;
    modeLight: string;
    modeAutoTimeLabel: string;
    switchToLight: string;
    switchToDark: string;
    tabApercu: string;
    tabContributions: string;
    tabChat: string;
    tabBillets: string;
    tabParametres: string;
    editProfileBtn: string;
    emptyBioHint: string;
    contributionSingular: string;
    contributionPlural: string;
    proStoreTitle: string;
    proStoreSubtitle: string;
    quickPortal: string;
    proVersionTitle: string;
    proVersionDesc: string;
    storeVersionTitle: string;
    storeVersionDesc: string;
    communityHubTitle: string;
    contribCardTitle: string;
    contribCardDescSuffix: string;
    chatCardTitle: string;
    chatCardDescSuffix: string;
    offlinePendingSuffix: string;
    autoSyncLabel: string;
    allExplorers: string;
    myContributions: string;
    top3Title: string;
    top3ChosenSuffix: string;
    top3Subtitle: string;
    chooseBtn: string;
    doneBtn: string;
    targetSlotLabel: string;
    clearSlot: string;
    slotLabel: string;
    emptySlot: string;
    allExpeditionsFilter: string;
    importDevicePhoto: string;
    anpnCertified: string;
    editSelection: string;
    favPhotosTitle: string;
    favPhotosSubtitle: string;
    noFavPhotos: string;
    noFavPhotosHint: string;
    expeditionPrefix: string;
    editTop3: string;
    allPhotos: string;
    unifiedOrdersTitle: string;
    logisticsLabel: string;
    receiptLabel: string;
    depositShort: string;
    confirmUssd: string;
    requestRefund: string;
    passesTitle: string;
    gmailEmails: string;
    h1Alerts: string;
    syncAllIcs: string;
    noPasses: string;
    passDetails: string;
    shareExpedition: string;
    icsDownloaded: string;
    addToCalendar: string;
    googleCalendar: string;
    icsFormatNote: string;
    h1ReminderTitle: string;
    h1ReminderDesc: string;
    testH1: string;
    active: string;
    inactive: string;
    badgesTitle: string;
    ecoPointsCumulative: string;
    badgesGalleryBtn: string;
    clubTitle: string;
    clubActive: string;
    clubWithAds: string;
    clubNoAds: string;
    clubFreeName: string;
    clubStarterName: string;
    clubMediumName: string;
    clubProName: string;
    perMonth: string;
    offlineMapsTitle: string;
    offlineMapsSubtitle: string;
    manageBtn: string;
    browserStorageLabel: string;
    packsReadySuffix: string;
    actionH1Title: string;
    configure: string;
    actionOfflineTitle: string;
    download: string;
    actionChecklist: string;
    actionMobileGuide: string;
    actionReplayIntro: string;
    themeScheduleTitle: string;
    lightFrom: string;
    darkFrom: string;
    nextSwitch: string;
    manualActive: string;
    dayBadge: string;
    nightBadge: string;
    editModalTitle: string;
    editModalSubtitle: string;
    avatarLabel: string;
    avatarHelper: string;
    displayNameLabel: string;
    roleLabel: string;
    rolePlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    favoriteParkLabel: string;
    phonePrivateLabel: string;
    bioLabel: string;
    bioPlaceholder: string;
    discoverableTitle: string;
    discoverableDesc: string;
    saveProfileBtn: string;
    savingError: string;
    nameMinError: string;
  };
  contributions: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaAdd: string;
    allSites: string;
    emptyTitle: string;
    emptyDescPrefix: string;
    emptyAllParks: string;
    addFirstPhoto: string;
    spotBadge: string;
    messageBtn: string;
    contributedOnPrefix: string;
    writeToPrefix: string;
    publishedBy: string;
    modalTitle: string;
    modalSubtitlePrefix: string;
    modalSubtitleSuffix: string;
    authPrompt: string;
    siteLabel: string;
    typeLabel: string;
    shortTitleLabel: string;
    shortTitlePlaceholder: string;
    zoneLabel: string;
    zonePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    photoRecommended: string;
    photoOptional: string;
    publishBtn: string;
    errAuth: string;
    errTitle: string;
    errDesc: string;
    errPhotoRequired: string;
    types: Record<SiteContributionType, { label: string; shortLabel: string }>;
  };
  chat: {
    authTitle: string;
    authDesc: string;
    sidebarTitle: string;
    discussionSingular: string;
    discussionPlural: string;
    realtimeLabel: string;
    newBtn: string;
    discussionsBtn: string;
    searchContactsPlaceholder: string;
    searchChatsPlaceholder: string;
    reachableTitle: string;
    noContacts: string;
    memberFallback: string;
    youPrefix: string;
    emptySelectionTitle: string;
    emptySelectionDesc: string;
    browseMembersBtn: string;
    privateThreadFallback: string;
    loadingMessages: string;
    threadStartPrefix: string;
    threadPrivacyNotePrefix: string;
    threadPrivacyNoteSuffix: string;
    attachPhotoAria: string;
    inputPlaceholderPrefix: string;
    sendBtn: string;
    sendError: string;
    backAria: string;
  };
  media: {
    defaultLabel: string;
    defaultHelper: string;
    cameraUnavailable: string;
    cameraDenied: string;
    captureError: string;
    invalidFile: string;
    processError: string;
    switchCamera: string;
    captureBtn: string;
    closeCameraAria: string;
    readyLabel: string;
    changeBtn: string;
    removeAria: string;
    takePhotoBtn: string;
    galleryBtn: string;
    uploadingCloud: string;
  };
  community: {
    modalTitle: string;
    modalSubtitle: string;
    activitiesTab: string;
    chatTab: string;
    authRequiredStrong: string;
    authRequiredRest: string;
    feedTitle: string;
    publishToggle: string;
    hideForm: string;
    parkLabel: string;
    typeLabel: string;
    titleLabel: string;
    titlePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    distancePlaceholder: string;
    elevationPlaceholder: string;
    photoPlaceholder: string;
    emptyTitleSignedIn: string;
    emptyTitleSignedOut: string;
    emptySubtitle: string;
    bravo: string;
    comments: string;
    noComments: string;
    commentPlaceholder: string;
    signInToComment: string;
    roomReadySuffix: string;
    roomReadyDesc: string;
    chatPlaceholderPrefix: string;
    signInToChat: string;
    you: string;
    activityTypes: Record<CommunityActivityType, string>;
  };
  gallery: {
    kicker: string;
    title: string;
    subtitle: string;
    addPhotoBtn: string;
    totalPhotosLabel: string;
    parksCoveredLabel: string;
    favoritesLabel: string;
    filterAll: string;
    filterLandscapes: string;
    filterExpeditions: string;
    filterCommunity: string;
    filterFavorites: string;
    allSitesOption: string;
    searchPlaceholder: string;
    viewGridAria: string;
    viewCompactAria: string;
    emptyTitle: string;
    emptySubtitle: string;
    resetFilters: string;
    sourceLandscape: string;
    sourceExpedition: string;
    sourceCommunity: string;
    sourceReview: string;
    favoriteAdd: string;
    favoriteRemove: string;
    applyBackdrop: string;
    backdropApplied: string;
    contactAuthor: string;
    openLightboxAria: string;
    prevPhotoAria: string;
    nextPhotoAria: string;
    downloadPhoto: string;
    featuredTag: string;
    uploadModalTitle: string;
    uploadModalSubtitle: string;
    uploadDestSite: string;
    uploadDestPersonal: string;
    titleLabel: string;
    titlePlaceholder: string;
    parkLabel: string;
    captionLabel: string;
    captionPlaceholder: string;
    submitBtn: string;
    errMissingImage: string;
    errMissingTitle: string;
    errSignInSite: string;
    toastBackdropTitle: string;
    toastBackdropDesc: string;
    toastPersonalTitle: string;
    toastPersonalDesc: string;
  };
  favoriteModal: {
    kicker: string;
    title: string;
    subtitleTitle: string;
    subtitleHint: string;
    tabAll: string;
    tabFavorites: string;
    tabUpload: string;
    maxSixError: string;
    invalidFormatError: string;
    tooLargeError: string;
    corruptFileError: string;
    missingImageError: string;
    invalidUrlError: string;
    missingTitleError: string;
    defaultCaption: string;
    removeFavTitle: string;
    addFavTitle: string;
    zoomTitle: string;
    chooseFileBtn: string;
    supportedFormats: string;
    orUrlLabel: string;
    titleLabel: string;
    titlePlaceholder: string;
    parkLabel: string;
    captionLabel: string;
    captionPlaceholder: string;
    saveUploadBtn: string;
    validateSelectionBtn: string;
    addToFavBtn: string;
    removeFromFavBtn: string;
  };
  ads: {
    sponsoredLabel: string;
    hideAdTitle: string;
    codePrefix: string;
    removeAdsBtn: string;
    promoCodeLabel: string;
    copyBtn: string;
    copiedLabel: string;
    freeTierNotice: string;
    planUpdatedToastTitle: string;
    planFreeToastDesc: string;
    planPaidToastDesc: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  fr: {
    language: {
      sectionTitle: "Langue de l'application",
      sectionSubtitle: 'Choisissez votre langue d’affichage (Français, Anglais ou Arabe)',
      rtlBadge: 'Sens RTL activé',
      ltrBadge: 'Sens LTR activé',
      toastTitle: 'Langue mise à jour',
      toastDesc: 'Interface affichée en Français.',
      switchTooltip: 'Changer la langue (FR / EN / AR)',
    },
    nav: {
      accueil: 'Accueil',
      explorer: 'Explorer',
      sorties: 'Aventures',
      equipement: 'Équipement',
      transports: 'Navettes',
      safety: 'Safety',
      galerie: 'Galerie',
      profil: 'Profil',
    },
    header: {
      tagline: 'Connaître pour mieux protéger',
      offline: 'Hors-ligne',
      app: 'App',
      sos: 'SOS',
      galleryTooltip: 'Galerie photo & paysages du Gabon',
      privateChatTooltip: 'Messages privés 1-à-1',
      communityTooltip: 'Communauté, activités & chat explorateurs',
      notificationsTooltip: 'Alertes de départ H-1 (Web Notification)',
      cartTooltip: 'Panier unifié et paiement in-app',
    },
    workspace: {
      explorer: 'Explorateur',
      professional: 'Pro & Guides',
      store: 'Magasin',
      explorerSub: 'Découvrir, réserver & louer au Gabon',
      professionalSub: 'Guides, Ornithologues, Botanistes & Experts',
      storeSub: 'Boutique Outdoor, Stock & Location',
      switchTitle: 'Mode d’utilisation MANGOREMA',
      backToExplorer: 'Vue Explorateur',
      landscapeLabel: 'Paysage :',
      landscapeTooltip: 'Choisir le paysage du Gabon en arrière-plan',
      landscapeAutoTitle: 'Ambiance dynamique',
      landscapeAutoDesc: 'S’adapte à chaque onglet',
      proTabs: {
        dashboard: 'Tableau Pro',
        offers: 'Sorties',
        bookings: 'Missions',
        profile: 'Profil ANPN',
      },
      storeTabs: {
        dashboard: 'Caisse',
        catalog: 'Boutique',
        rentals: 'Locations',
        orders: 'Commandes',
        profile: 'Magasin',
      },
    },
    common: {
      offlineBanner: 'Mode Hors-ligne : les cartes et billets sont chargés depuis le cache local.',
      free: 'Gratuit',
      seeAll: 'Voir tout',
      cancel: 'Annuler',
      publish: 'Publier',
      close: 'Fermer',
      connectGoogle: 'Connexion Google',
      signIn: 'Connexion',
      signOut: 'Déconnexion',
      onlineLabel: 'en ligne',
    },
    home: {
      heroBadge: 'Super-App Gabon · Écotourisme',
      heroTitle: 'Le Gabon se vit en pleine nature.',
      heroSubtitle:
        'Randonnées, navettes 4x4 mutualisées, camping & guides ANPN payables en un clic avec Airtel, Moov Money & GhettoPay.',
      statHikers: 'Randonneurs',
      statParksCount: '13 Parcs',
      statParks: 'ANPN Gabon',
      statMobileMoney: 'Mobile Money',
      quickGps: 'Traceur GPS',
      quickShuttles: 'Navettes',
      quickChecklist: 'Checklist',
      quickSos: 'Alerte SOS',
      universeTitle: "Univers d'Activités MANGOREMA",
      universeSubtitle: '4 Pôles · Gabon',
      poleExpeditions: 'Expéditions',
      hubSubExpeditions: 'Parcs & treks',
      poleShuttles: 'Navettes',
      hubSubShuttles: '4x4 & pirogues',
      poleRental: 'Location',
      hubSubGear: 'Achat & location',
      poleGuides: 'Guides',
      hubSubGuides: 'Cartes & experts',
      ecoTitle: 'Défis Écologiques Zéro Déchet',
      ecoDesc: 'Validez vos sorties sans laisser de déchets et gagnez des badges virtuels synchronisés Firebase.',
      ecoPointsUnit: 'pts éco',
      ecoCleanParks: 'parcs propres',
      ecoBadgesBtn: 'Badges',
      ecoJoinBtn: 'Relever',
      communityTitle: 'Communauté & Chat Explorateurs',
      communityDesc:
        'Publiez vos sorties, commentez les découvertes des autres randonneurs et discutez en direct par parc.',
      communityPostsUnit: 'posts',
      communityPublishCommentBtn: 'Publier / Commenter',
      communityChatBtn: 'Chat Direct',
      rentalBadge: 'MANGOREMA LOCATION',
      rentalVerified: '✓ Cautions Mobile Money',
      rentalTitle: 'Location de Matériel Bivouac & Outdoor',
      rentalDesc: 'Tentes dôme étanches (>4000mm), sacs 65L, VTT d’expédition et balises satellite Garmin InReach.',
      rentalPickup: 'Retraits : Charbonnages · Batterie 4 · Akanda',
      rentalCta: 'Louer du matériel',
      rentalChecklistBtn: 'Checklist',
      rentalStoreCta: 'Boutique & Location',
      featuredTitle: 'Expéditions Vedettes au Gabon',
      organizerPrefix: 'Org:',
      bookCartBtn: 'Réserver (Panier)',
      shuttlesBannerTitle: 'Navettes Mutualisées MANGOREMA',
      shuttlesBannerDesc: 'Départs réguliers de Libreville (Charbonnages, Okala, Owendo)',
      allRoutesBtn: 'Tous les trajets',
      seatsUnit: 'places',
      galleryTitle: 'Galerie Photo du Gabon',
      gallerySubtitle: 'Paysages, faune et clichés des explorateurs sur le terrain',
      galleryCta: 'Ouvrir la galerie',
    },
    weather: {
      title: 'Météo des Parcs Nationaux',
      subtitle: 'Conditions en direct · Open-Meteo Gabon',
      liveTag: 'En direct',
      cachedTag: 'Cache local',
      refreshTooltip: 'Actualiser la météo des parcs',
      errorMsg: 'Impossible de joindre la station météo (vérifiez votre connexion).',
      retryBtn: 'Réessayer',
      loadingText: 'Chargement météo des parcs nationaux...',
      feelsLike: 'Ressenti',
      humidity: 'Humidité',
      wind: 'Vent',
      precip: 'Précip.',
      forecast4Days: 'Prévisions 4 jours',
      parkNames: {
        mondah: { name: 'Parc National de la Mondah', shortName: 'Mondah', region: 'Estuaire · Cap Estérias' },
        loango: { name: 'Parc National de Loango', shortName: 'Loango', region: 'Ogooué-Maritime · Iguéla' },
        lope: { name: 'Parc National de la Lopé', shortName: 'La Lopé', region: 'Ogooué-Ivindo · UNESCO' },
        pongara: { name: 'Parc National de Pongara', shortName: 'Pongara', region: 'Estuaire · Nyonié' },
        ivindo: { name: "Parc National de l'Ivindo", shortName: 'Ivindo', region: 'Makokou · Chutes Kongou' },
        cristal: { name: 'Parc Nat. Monts de Cristal', shortName: 'Mts Cristal', region: 'Woleu-Ntem · Kinguélé' },
      },
    },
    explorer: {
      title: 'Cartographie des Sentiers & Parcs',
      subtitle: 'Tracés GPS réels, balisages ANPN & géolocalisation',
      trackerBtn: 'Traceur',
      offlineModeBtn: 'Mode Hors-Ligne',
      offlineModeActive: 'Hors-Ligne Actif',
      offlineManageBtn: 'Télécharger / Gérer',
      offlineBarTitle: 'Cartes Hors-Ligne (LocalStorage)',
      offlineBarHint: 'Consultez les sentiers GPS et postes ANPN même sans réseau.',
      offlineSavedCount: 'cartes en mémoire',
      offlineConsultBtn: 'Consulter',
      offlineDownloadNowBtn: 'Télécharger cette carte',
      offlineMissingNotice: 'Ce parc n’est pas encore téléchargé dans votre stockage local.',
      offlineLegendLabel: 'Mode Hors-Ligne LocalStorage',
      filterAll: '🗺️ Tous les Parcs',
      filterMondah: '🌿 Mondah (Cap)',
      filterIvindo: '🌊 Ivindo (Djidji)',
      filterDenis: '🏖️ Pongara / Denis',
      filterCristal: '⛰️ Mts Cristal',
      filterLoango: '🐘 Loango',
      filterLope: '🏞️ La Lopé',
    },
    sorties: {
      title: 'Calendrier des Expéditions au Gabon',
      subtitle: 'Bivouacs encadrés par des écoguides et clubs certifiés',
      communityBtn: 'Communauté',
      catAll: 'Toutes les Sorties',
      catPublic: 'Rando Publique',
      catPrivate: 'Expé Privée',
      catInstitutional: 'Éco-Volontariat',
      distance: 'Distance',
      elevation: 'Dénivelé',
      duration: 'Durée',
      passBtn: 'Pass Expédition (Panier Multi-Services)',
      validated: 'Validé',
    },
    equipement: {
      title: 'Marketplace Équipement Gabon',
      subtitle: 'Achat neuf, collection MANGOREMA & location bivouac Libreville',
      cartBtn: 'Panier',
      shopTab: 'Boutique',
      rentalTab: 'Location',
      shopSearchPlaceholder: 'Rechercher chaussures, lampe, gourde, jumelles...',
      rentalSearchPlaceholder: 'Rechercher tente, sac 65L, VTT, balise GPS...',
      viewCart: 'Voir panier',
      partnerStores: 'Magasins Partenaires',
      showAll: 'Tout afficher',
      emptyProducts: 'Aucun équipement ne correspond à votre recherche.',
      officialBadge: 'Officiel',
      stockLabel: 'Stock :',
      outOfStock: 'Épuisé',
      pickup: 'Retrait',
      delivery: 'Livraison',
      addToCart: 'Ajouter',
      outOfStockShort: 'Rupture',
      addedProductToast: 'ajouté au panier',
      addedRentalToast: 'ajoutée au panier',
      cautionBannerTitle: 'Cautions sécurisées & état des lieux photo',
      cautionBannerDesc: 'Retraits Charbonnages · Batterie 4 · Akanda · Port-Môle',
      checklistBtn: 'Checklist',
      perDay: '/ jour',
      availableSuffix: 'dispo',
      full: 'Complet',
      pickupLabel: 'Retrait',
      durationLabel: 'Durée',
      daysUnit: 'j',
      depositLabel: 'Caution :',
      unavailable: 'Indisponible',
      rentLabel: 'Louer',
      categories: {
        all: 'Tout',
        randonnee: 'Randonnée',
        camping: 'Camping',
        chaussures_vetements: 'Tenues',
        optique_photo: 'Optique & Photo',
        eclairage_gadgets: 'Éclairage & Tech',
        lifestyle_mangorema: 'Officiel MANGOREMA',
      },
    },
    transports: {
      title: 'MANGOREMA Logistics & Navettes',
      subtitle: 'Trajets groupés et mutualisés au départ des carrefours clés de Libreville',
      filterAll: 'Tous les Trajets',
      filterBus: 'Minibus 15P',
      filter4x4: '4x4 Tout-Terrain',
      filterBoat: 'Bateau / Pirogue',
      safetyTitle: 'Flotte Agréée & Sécurisée',
      safetyDesc: "Véhicules révisés, gilets SOLAS sur l'eau, chauffeurs connaissant parfaitement les pistes gabonaises.",
      rentalTitle: 'MANGOREMA LOCATION Matériel',
      rentalDesc: "Tentes bivouac, sacs 65L, VTT d'expédition et balises GPS",
      rentBtn: 'Louer',
      perPerson: 'par personne A/R',
      fleetTitle: 'Occupation flotte en direct',
      openSeatsLabel: 'places libres',
      avgOccupancyLabel: 'Taux moyen',
      liveOccupancy: 'Taux d’occupation',
      seatsBookedLabel: 'occupées',
      seatsFreeLabel: 'libres',
      statusAvailable: 'Places disponibles',
      statusFillingFast: 'Se remplit vite',
      statusLastSeats: 'Dernières places',
      statusFull: 'Complet',
      meetingPoint: 'Point de rencontre',
      destinationLabel: 'Destination parc / plage',
      departureLabel: 'Départ',
      returnLabel: 'Retour',
      driverLabel: 'Chauffeur',
      alertH1: 'Alerte H-1',
      addCartBtn: 'Panier',
      reserveBtn: 'Réserver',
      emptyFilterTitle: 'Aucune navette pour cette catégorie',
      resetFilterBtn: 'Voir tous les trajets',
    },
    safety: {
      title: 'Sécurité Sentiers & Vigilance ANPN',
      subtitle: "Signaux d'alerte, crues de rivières, faune et réseau des écogardes gabonais",
      beaconKicker: "BALISE NUMÉRIQUE D'URGENCE",
      beaconTitle: 'DÉCLENCHER LES SECOURS ANPN',
      beaconDesc: 'Envoie instantanément vos coordonnées GPS par SMS satellitaire au poste de garde le plus proche.',
      beaconBtn: 'Ouvrir la Balise SOS',
      activeIncidentsTitle: 'Alertes de Terrain Actives',
      verifiedAnpn: 'Validé ANPN',
      userReport: 'Signalement usager',
      reportedAt: 'Signalé :',
    },
    profile: {
      cloudActive: '✓ Compte Google & Firestore actif',
      cloudActiveDesc: 'Billets, favoris & stats sauvegardés dans le cloud',
      cloudInactive: 'Sauvegarde Cloud (Firebase)',
      cloudInactiveDesc: 'Connectez votre compte Google pour persister vos billets',
      metricKm: 'Kilomètres',
      metricAscent: 'Dénivelé',
      metricSteps: 'Pas Forêt',
      appearanceTitle: 'Apparence & Mode Sombre',
      modeAuto: 'Auto',
      modeDark: 'Sombre',
      modeLight: 'Clair',
      modeAutoTimeLabel: 'Auto (Heure)',
      switchToLight: 'Mode Clair',
      switchToDark: 'Mode Sombre',
      tabApercu: 'Aperçu & Aventures',
      tabContributions: 'Contributions & Photos Sites',
      tabChat: 'Chat Privé',
      tabBillets: 'Billets & Commandes',
      tabParametres: 'Paramètres & Outils',
      editProfileBtn: 'Modifier profil',
      emptyBioHint: 'Ajoutez une bio et votre parc favori pour vous présenter aux explorateurs et guides.',
      contributionSingular: 'contribution site',
      contributionPlural: 'contributions site',
      proStoreTitle: 'Versions Professionnel & Magasin',
      proStoreSubtitle: 'Espaces métier dédiés · Reversements 90%',
      quickPortal: 'Portail rapide',
      proVersionTitle: 'Version Professionnel',
      proVersionDesc: 'Guides ANPN, Ornithologues, Botanistes, Pisteurs',
      storeVersionTitle: 'Version Magasin',
      storeVersionDesc: 'Boutique Outdoor, Gestion Stock & Location',
      communityHubTitle: 'Communauté & Interactions',
      contribCardTitle: 'Contribuer & Photos Sites',
      contribCardDescSuffix: 'partage(s) sur les parcs du Gabon',
      chatCardTitle: 'Ouvrir le Chat Privé',
      chatCardDescSuffix: 'conversation(s) directe(s) 1-à-1',
      offlinePendingSuffix: 'donnée(s) terrain en attente de réseau',
      autoSyncLabel: 'Synchro auto',
      allExplorers: 'Tous les explorateurs',
      myContributions: 'Mes contributions',
      top3Title: 'Top 3 Expéditions Réalisées',
      top3ChosenSuffix: 'choisis',
      top3Subtitle: 'Vos plus beaux clichés mis en valeur en tête de profil',
      chooseBtn: 'Choisir',
      doneBtn: 'Terminer',
      targetSlotLabel: 'Emplacement cible :',
      clearSlot: 'Vider le Slot',
      slotLabel: 'Slot',
      emptySlot: 'Emplacement vide',
      allExpeditionsFilter: 'Toutes les expéditions',
      importDevicePhoto: "Importer un cliché de l'appareil",
      anpnCertified: 'Certifié expéditions Gabon (ANPN)',
      editSelection: 'Modifier la sélection →',
      favPhotosTitle: 'Mes Photos Préférées',
      favPhotosSubtitle: 'Vos plus beaux souvenirs en forêt gabonaise',
      noFavPhotos: 'Aucune photo préférée sélectionnée',
      noFavPhotosHint: "Touchez ici pour choisir jusqu'à 6 photos de vos randonnées ou en importer de nouvelles.",
      expeditionPrefix: 'Expédition :',
      editTop3: 'Modifier mon Top 3',
      allPhotos: 'Toutes les photos',
      unifiedOrdersTitle: 'Commandes Unifiées & Boutique',
      logisticsLabel: 'Logistique :',
      receiptLabel: 'Reçu :',
      depositShort: 'Caution',
      confirmUssd: 'Confirmer USSD',
      requestRefund: 'Demander remboursement',
      passesTitle: 'Mes Billets & Pass Électroniques',
      gmailEmails: 'Emails Gmail',
      h1Alerts: 'Alertes H-1',
      syncAllIcs: 'Tout synchroniser (.ics)',
      noPasses: 'Aucun billet actif pour le moment. Réservez une expédition pour obtenir votre pass QR Code sécurisé.',
      passDetails: 'Détails du pass',
      shareExpedition: 'Partager mon expédition',
      icsDownloaded: 'Fichier .ics téléchargé',
      addToCalendar: "Ajouter à l'agenda (.ics)",
      googleCalendar: 'Google Agenda',
      icsFormatNote: 'Format .ics (Apple & Google)',
      h1ReminderTitle: 'Rappel H-1 avant départ',
      h1ReminderDesc: 'Notification locale 1h avant la navette / expédition (API Web)',
      testH1: 'Tester H-1',
      active: 'Actif',
      inactive: 'Inactif',
      badgesTitle: 'Badges Écotourisme Débloqués',
      ecoPointsCumulative: 'pts éco cumulés',
      badgesGalleryBtn: 'Galerie de Badges',
      clubTitle: 'Abonnements MANGOREMA Club',
      clubActive: '✓ Actif',
      clubWithAds: 'Avec pubs partenaires',
      clubNoAds: 'Sans publicité',
      clubFreeName: 'Gratuit',
      clubStarterName: 'Starter',
      clubMediumName: 'Medium',
      clubProName: 'Pro Expé',
      perMonth: '/mois',
      offlineMapsTitle: 'Fonds de Carte Hors-Ligne (OpenStreetMap)',
      offlineMapsSubtitle: 'Stockage local des tuiles pour naviguer sans réseau 4G',
      manageBtn: 'Gérer',
      browserStorageLabel: 'Stockage local navigateur :',
      packsReadySuffix: 'pack(s) prêt(s)',
      actionH1Title: 'Alertes Locales de Départ H-1 (Web Notification)',
      configure: 'Configurer',
      actionOfflineTitle: 'Fonds de Carte Hors-Ligne (Tuiles OpenStreetMap)',
      download: 'Télécharger',
      actionChecklist: 'Ma Checklist Bivouac Équatorial',
      actionMobileGuide: 'Guide Mobile App (Capacitor / PWA / Android)',
      actionReplayIntro: 'Revoir la Présentation MANGOREMA',
      themeScheduleTitle: 'Plage horaire automatique (heure locale)',
      lightFrom: '☀️ Mode Clair dès :',
      darkFrom: '🌙 Mode Sombre dès :',
      nextSwitch: 'Prochaine bascule :',
      manualActive: 'Mode manuel actif (prioritaire sur les horaires)',
      dayBadge: '☀️ Jour',
      nightBadge: '🌙 Nuit',
      editModalTitle: 'Modifier mon profil explorateur',
      editModalSubtitle: 'Synchronisé avec votre fiche publique & votre messagerie privée',
      avatarLabel: 'Photo de profil',
      avatarHelper: 'Prendre un selfie ou choisir dans la galerie',
      displayNameLabel: 'Nom affiché',
      roleLabel: 'Rôle / Spécialité',
      rolePlaceholder: 'Ex : Écotouriste Gabon, Photographe...',
      cityLabel: 'Ville / Base',
      cityPlaceholder: 'Ex : Libreville, Port-Gentil...',
      favoriteParkLabel: 'Parc favori',
      phonePrivateLabel: 'Téléphone Mobile Money (privé, non affiché publiquement)',
      bioLabel: "Bio d'explorateur",
      bioPlaceholder: "Présentez vos parcs préférés, vos centres d'intérêt (bivouac, ornithologie, trek)...",
      discoverableTitle: "Visible dans l'annuaire du Chat Privé",
      discoverableDesc: 'Votre e-mail et téléphone restent toujours strictement privés.',
      saveProfileBtn: 'Enregistrer le profil',
      savingError: 'Enregistrement impossible.',
      nameMinError: 'Veuillez renseigner votre nom (minimum 2 caractères).',
    },
    contributions: {
      kicker: 'Terrain & Repérages Communautaires',
      title: 'Contributions & Photos des Sites du Gabon',
      subtitle: 'Partagez vos clichés, conditions de sentier et observations faune directement sur les parcs nationaux.',
      ctaAdd: 'Contribuer · Ajouter une photo',
      allSites: 'Tous les sites',
      emptyTitle: 'Aucune photo ni contribution sur ce site pour le moment',
      emptyDescPrefix: 'Soyez le premier à documenter les sentiers, la faune ou les panoramas sur',
      emptyAllParks: 'les parcs nationaux du Gabon',
      addFirstPhoto: 'Ajouter la première photo',
      spotBadge: 'Repérage',
      messageBtn: 'Message',
      contributedOnPrefix: 'A contribué sur',
      writeToPrefix: 'Écrire à',
      publishedBy: 'Publié par',
      modalTitle: 'Contribuer sur un site du Gabon',
      modalSubtitlePrefix: 'Publiée sous',
      modalSubtitleSuffix: 'Visible par la communauté',
      authPrompt: 'Connectez-vous avec votre compte Google pour ajouter des photos et contributions terrain.',
      siteLabel: 'Site ou Parc National',
      typeLabel: 'Type de contribution',
      shortTitleLabel: 'Titre court',
      shortTitlePlaceholder: 'Ex : Lever de soleil sur la lagune',
      zoneLabel: 'Secteur / Point précis (optionnel)',
      zonePlaceholder: 'Ex : Sentier Botanique Nord',
      descLabel: 'Observation & détails terrain',
      descPlaceholder: "Partagez l'état du sentier, les espèces aperçues, l'heure idéale ou les recommandations d'équipement...",
      photoRecommended: 'Photo du site (recommandée)',
      photoOptional: 'Photo illustrative (optionnelle)',
      publishBtn: 'Publier sur le site',
      errAuth: 'Connectez-vous avec Google pour publier sur les sites du Gabon.',
      errTitle: 'Veuillez saisir un titre clair (minimum 2 caractères).',
      errDesc: 'Veuillez ajouter une description ou observation terrain.',
      errPhotoRequired: 'Ajoutez une photo ou changez le type en Observation / Conseil sentier.',
      types: {
        PHOTO: { label: 'Photo du site', shortLabel: 'Photo' },
        OBSERVATION: { label: 'Observation faune & flore', shortLabel: 'Observation' },
        TRAIL_TIP: { label: 'État & conseil sentier', shortLabel: 'Sentier' },
        CAMP_INFO: { label: 'Accès & bivouac', shortLabel: 'Bivouac' },
      },
    },
    chat: {
      authTitle: 'Messagerie Privée 1-à-1 MANGOREMA',
      authDesc: 'Connectez-vous avec Google pour discuter en privé avec les contributeurs des sites, organiser un covoiturage ou joindre un guide certifié ANPN.',
      sidebarTitle: 'Messages Privés',
      discussionSingular: 'discussion',
      discussionPlural: 'discussions',
      realtimeLabel: 'Temps réel',
      newBtn: 'Nouveau',
      discussionsBtn: 'Discussions',
      searchContactsPlaceholder: 'Chercher un explorateur ou guide...',
      searchChatsPlaceholder: 'Filtrer les conversations...',
      reachableTitle: 'Explorateurs & Guides joignables',
      noContacts: 'Aucun autre profil public disponible pour le moment. Les membres connectés apparaissent ici automatiquement.',
      memberFallback: 'Membre MANGOREMA',
      youPrefix: 'Vous :',
      emptySelectionTitle: 'Sélectionnez une discussion privée',
      emptySelectionDesc: 'Choisissez une conversation à gauche ou cliquez sur « Nouveau » pour écrire à un explorateur ou guide du Gabon.',
      browseMembersBtn: 'Parcourir les membres',
      privateThreadFallback: 'Conversation privée directe',
      loadingMessages: 'Chargement des messages privés...',
      threadStartPrefix: 'Début de votre échange privé avec',
      threadPrivacyNotePrefix: 'Seuls vous et',
      threadPrivacyNoteSuffix: 'pouvez lire cette conversation.',
      attachPhotoAria: 'Joindre une photo',
      inputPlaceholderPrefix: 'Message privé à',
      sendBtn: 'Envoyer',
      sendError: 'Envoi du message impossible.',
      backAria: 'Retour aux discussions',
    },
    media: {
      defaultLabel: 'Photo du terrain',
      defaultHelper: 'Appareil photo direct ou galerie · Compression JPEG auto',
      cameraUnavailable: 'Caméra indisponible sur ce navigateur. Utilisez Galerie / Fichier.',
      cameraDenied: "Autorisation caméra refusée ou appareil occupé. Choisissez une photo depuis l'appareil.",
      captureError: 'Impossible de capturer l’image. Réessayez.',
      invalidFile: 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).',
      processError: 'Erreur lors du traitement de la photo sélectionnée.',
      switchCamera: 'Pivoter',
      captureBtn: 'Capturer',
      closeCameraAria: 'Fermer la caméra',
      readyLabel: 'Prête',
      changeBtn: 'Changer',
      removeAria: 'Retirer la photo',
      takePhotoBtn: 'Prendre photo',
      galleryBtn: 'Galerie / Fichier',
      uploadingCloud: 'Envoi sécurisé vers le Cloud...',
    },
    community: {
      modalTitle: 'Communauté & Chat MANGOREMA',
      modalSubtitle: 'Publiez vos sorties, commentez et échangez en direct',
      activitiesTab: 'Activités',
      chatTab: 'Chat Direct',
      authRequiredStrong: 'Connexion Google requise',
      authRequiredRest: 'pour lire, publier, commenter et discuter avec les autres explorateurs.',
      feedTitle: 'Fil des sorties au Gabon',
      publishToggle: 'Publier une activité',
      hideForm: 'Masquer',
      parkLabel: 'Parc / Zone',
      typeLabel: "Type d'activité",
      titleLabel: 'Titre de la sortie',
      titlePlaceholder: 'Ex: Boucle matinale forêt de la Mondah',
      descLabel: 'Compte-rendu terrain',
      descPlaceholder: 'État du sentier, météo, espèces observées, conseils pour les prochains groupes...',
      distancePlaceholder: 'Distance (km, opt.)',
      elevationPlaceholder: 'Dénivelé +m (opt.)',
      photoPlaceholder: 'Lien photo (https://..., optionnel)',
      emptyTitleSignedIn: 'Aucune activité publiée pour le moment.',
      emptyTitleSignedOut: 'Connectez-vous avec Google pour consulter et partager des activités.',
      emptySubtitle: 'Partagez votre dernière sortie en forêt, une observation faune ou un bivouac pour lancer la discussion.',
      bravo: 'Bravo',
      comments: 'Commentaires',
      noComments: 'Aucun commentaire pour le moment. Soyez le premier à réagir !',
      commentPlaceholder: "Commenter l'activité de",
      signInToComment: 'Se connecter avec Google pour commenter',
      roomReadySuffix: 'prêt pour vos échanges',
      roomReadyDesc: "Posez une question sur l'état d'un sentier, coordonnez un covoiturage 4x4 ou partagez une alerte météo en direct.",
      chatPlaceholderPrefix: 'Message dans',
      signInToChat: 'Se connecter avec Google pour écrire dans le chat',
      you: 'Vous',
      activityTypes: {
        RANDONNEE: 'Randonnée',
        FAUNE: 'Faune & Flore',
        BIVOUAC: 'Bivouac',
        ECO_ACTION: 'Éco-Action',
      },
    },
    gallery: {
      kicker: 'Photothèque Mangorema · Parcs & Expéditions',
      title: 'Galerie Photo du Gabon',
      subtitle: 'Paysages équatoriaux, souvenirs de bivouac et prises de vue partagées par les explorateurs sur les sites protégés.',
      addPhotoBtn: 'Ajouter une photo',
      totalPhotosLabel: 'Images',
      parksCoveredLabel: 'Sites représentés',
      favoritesLabel: 'Coups de cœur',
      filterAll: 'Toutes',
      filterLandscapes: 'Paysages',
      filterExpeditions: 'Expéditions',
      filterCommunity: 'Communauté',
      filterFavorites: 'Mes favoris',
      allSitesOption: 'Tous les sites du Gabon',
      searchPlaceholder: 'Rechercher un parc, un titre, un explorateur...',
      viewGridAria: 'Affichage éditorial',
      viewCompactAria: 'Affichage mosaïque',
      emptyTitle: 'Aucune photo pour ces critères',
      emptySubtitle: 'Modifiez votre recherche ou publiez votre premier cliché depuis un parc du Gabon.',
      resetFilters: 'Réinitialiser les filtres',
      sourceLandscape: 'Paysage officiel',
      sourceExpedition: 'Expédition',
      sourceCommunity: 'Terrain · Communauté',
      sourceReview: 'Avis voyageur',
      favoriteAdd: 'Ajouter aux favoris',
      favoriteRemove: 'Retirer des favoris',
      applyBackdrop: 'Appliquer en fond d’écran',
      backdropApplied: 'Fond actif',
      contactAuthor: 'Écrire en privé',
      openLightboxAria: 'Agrandir la photo',
      prevPhotoAria: 'Photo précédente',
      nextPhotoAria: 'Photo suivante',
      downloadPhoto: 'Télécharger',
      featuredTag: 'À la une',
      uploadModalTitle: 'Publier une photo dans la galerie',
      uploadModalSubtitle: 'Partagez un cliché avec la communauté sur un parc du Gabon ou ajoutez-le à votre album.',
      uploadDestSite: 'Site du Gabon (Public Cloud)',
      uploadDestPersonal: 'Mon album d’expédition',
      titleLabel: 'Titre de la photo',
      titlePlaceholder: 'Ex: Lever de soleil sur la lagune d’Iguéla',
      parkLabel: 'Parc / Site du Gabon',
      captionLabel: 'Légende ou observation',
      captionPlaceholder: 'Décrivez l’instant, le sentier ou la faune observée...',
      submitBtn: 'Publier dans la galerie',
      errMissingImage: 'Veuillez capturer ou sélectionner une image.',
      errMissingTitle: 'Veuillez saisir un titre pour la photo.',
      errSignInSite: 'Connectez-vous avec Google pour publier sur un site public, ou choisissez « Mon album d’expédition ».',
      toastBackdropTitle: 'Paysage appliqué en fond',
      toastBackdropDesc: 'L’arrière-plan vitré affiche désormais :',
      toastPersonalTitle: 'Photo ajoutée à la galerie',
      toastPersonalDesc: 'Votre cliché est enregistré dans vos photos d’expédition et favoris.',
    },
    favoriteModal: {
      kicker: 'GALERIE EXPÉDITIONS GABON',
      title: 'Choisir mes Photos Préférées',
      subtitleTitle: 'Sélectionnez vos coups de cœur',
      subtitleHint: 'Elles s’afficheront en vitrine sur votre profil d’explorateur (max 6).',
      tabAll: 'Toutes',
      tabFavorites: 'Favoris',
      tabUpload: 'Ajouter photo',
      maxSixError: 'Vous pouvez choisir jusqu’à 6 photos coup de cœur à mettre en avant sur votre profil.',
      invalidFormatError: 'Format non autorisé. Choisissez une image JPG, PNG, WEBP ou GIF.',
      tooLargeError: 'Image trop volumineuse (maximum 6 Mo).',
      corruptFileError: 'Fichier image invalide ou corrompu.',
      missingImageError: 'Veuillez sélectionner une image depuis votre appareil ou renseigner une adresse web.',
      invalidUrlError: 'Adresse d’image invalide. Utilisez un lien https:// ou un fichier JPG/PNG/WEBP.',
      missingTitleError: 'Veuillez donner un titre à votre photo.',
      defaultCaption: 'Photo personnelle ajoutée à mon carnet d’expédition MANGOREMA.',
      removeFavTitle: 'Retirer des favoris',
      addFavTitle: 'Ajouter aux favoris',
      zoomTitle: 'Agrandir',
      chooseFileBtn: 'Choisir une photo sur mon appareil',
      supportedFormats: 'Formats supportés : JPG, PNG, WEBP',
      orUrlLabel: 'Ou renseigner l’adresse d’une image (URL) :',
      titleLabel: 'Titre de la photo :',
      titlePlaceholder: 'Ex: Soirée bivouac Cap Estérias',
      parkLabel: 'Parc / Lieu au Gabon :',
      captionLabel: 'Légende / Récit de randonnée :',
      captionPlaceholder: 'Quelques mots sur ce moment fort...',
      saveUploadBtn: 'Enregistrer et ajouter aux favoris',
      validateSelectionBtn: 'Valider ma sélection',
      addToFavBtn: 'Ajouter à mes photos favorites',
      removeFromFavBtn: 'Retirer des photos favorites',
    },
    ads: {
      sponsoredLabel: 'Sponsorisé',
      hideAdTitle: 'Masquer cette annonce',
      codePrefix: 'Code',
      removeAdsBtn: 'Passer sans pub',
      promoCodeLabel: 'Code partenaire à utiliser',
      copyBtn: 'Copier',
      copiedLabel: 'Copié',
      freeTierNotice: 'Annonce affichée uniquement sur la version Gratuite de MANGOREMA.',
      planUpdatedToastTitle: 'Formule MANGOREMA mise à jour',
      planFreeToastDesc: 'Version Gratuite active (avec annonces partenaires Gabon).',
      planPaidToastDesc: 'Navigation sans publicité activée pour votre compte.',
    },
  },
  en: {
    language: {
      sectionTitle: 'App Language',
      sectionSubtitle: 'Choose your display language (French, English or Arabic)',
      rtlBadge: 'RTL layout active',
      ltrBadge: 'LTR layout active',
      toastTitle: 'Language updated',
      toastDesc: 'Interface switched to English.',
      switchTooltip: 'Switch language (FR / EN / AR)',
    },
    nav: {
      accueil: 'Home',
      explorer: 'Explore',
      sorties: 'Adventures',
      equipement: 'Gear',
      transports: 'Shuttles',
      safety: 'Safety',
      galerie: 'Gallery',
      profil: 'Profile',
    },
    header: {
      tagline: 'Know to better protect',
      offline: 'Offline',
      app: 'App',
      sos: 'SOS',
      galleryTooltip: 'Gabon Photo Gallery & Landscapes',
      privateChatTooltip: '1-on-1 Private Messages',
      communityTooltip: 'Community activities & live explorer chat',
      notificationsTooltip: 'H-1 departure alerts (Web Notification)',
      cartTooltip: 'Unified cart & in-app checkout',
    },
    workspace: {
      explorer: 'Explorer',
      professional: 'Pro & Guides',
      store: 'Store',
      explorerSub: 'Discover, book & rent gear in Gabon',
      professionalSub: 'Guides, Ornithologists, Botanists & Experts',
      storeSub: 'Outdoor Shop, Inventory & Rentals',
      switchTitle: 'MANGOREMA App Version',
      backToExplorer: 'Explorer View',
      landscapeLabel: 'Backdrop:',
      landscapeTooltip: 'Choose Gabon landscape background',
      landscapeAutoTitle: 'Dynamic mood',
      landscapeAutoDesc: 'Adapts to each tab',
      proTabs: {
        dashboard: 'Pro Hub',
        offers: 'Trips',
        bookings: 'Missions',
        profile: 'ANPN Profile',
      },
      storeTabs: {
        dashboard: 'POS',
        catalog: 'Shop',
        rentals: 'Rentals',
        orders: 'Orders',
        profile: 'Store',
      },
    },
    common: {
      offlineBanner: 'Offline Mode: maps and tickets are loaded from local cache.',
      free: 'Free',
      seeAll: 'View all',
      cancel: 'Cancel',
      publish: 'Publish',
      close: 'Close',
      connectGoogle: 'Google Sign-In',
      signIn: 'Sign in',
      signOut: 'Sign out',
      onlineLabel: 'online',
    },
    home: {
      heroBadge: 'Gabon Super-App · Ecotourism',
      heroTitle: 'Experience Gabon in the wild.',
      heroSubtitle:
        'Guided hikes, shared 4x4 shuttles, bivouac camping & ANPN rangers payable in one click with Airtel, Moov Money & GhettoPay.',
      statHikers: 'Hikers',
      statParksCount: '13 Parks',
      statParks: 'ANPN Gabon',
      statMobileMoney: 'Mobile Money',
      quickGps: 'GPS Tracker',
      quickShuttles: 'Shuttles',
      quickChecklist: 'Checklist',
      quickSos: 'SOS Alert',
      universeTitle: 'MANGOREMA Activity Hubs',
      universeSubtitle: '4 Hubs · Gabon',
      poleExpeditions: 'Expeditions',
      hubSubExpeditions: 'Parks & treks',
      poleShuttles: 'Shuttles',
      hubSubShuttles: '4x4 & pirogues',
      poleRental: 'Rentals',
      hubSubGear: 'Shop & rentals',
      poleGuides: 'Guides',
      hubSubGuides: 'Maps & experts',
      ecoTitle: 'Zero-Waste Eco Challenges',
      ecoDesc: 'Validate leave-no-trace expeditions and earn virtual eco badges synced with Firebase.',
      ecoPointsUnit: 'eco pts',
      ecoCleanParks: 'clean parks',
      ecoBadgesBtn: 'Badges',
      ecoJoinBtn: 'Join',
      communityTitle: 'Explorer Community & Live Chat',
      communityDesc:
        'Publish your trail stories, comment on other hikers’ discoveries and chat live by park.',
      communityPostsUnit: 'posts',
      communityPublishCommentBtn: 'Post / Comment',
      communityChatBtn: 'Live Chat',
      rentalBadge: 'MANGOREMA RENTALS',
      rentalVerified: '✓ Mobile Money Deposits',
      rentalTitle: 'Bivouac & Outdoor Gear Rental',
      rentalDesc: 'Waterproof dome tents (>4000mm), 65L backpacks, expedition MTBs and Garmin InReach beacons.',
      rentalPickup: 'Pickup: Charbonnages · Batterie 4 · Akanda',
      rentalCta: 'Rent Gear',
      rentalChecklistBtn: 'Checklist',
      rentalStoreCta: 'Shop & Rentals',
      featuredTitle: 'Featured Expeditions in Gabon',
      organizerPrefix: 'Org:',
      bookCartBtn: 'Book (Cart)',
      shuttlesBannerTitle: 'MANGOREMA Shared Shuttles',
      shuttlesBannerDesc: 'Regular departures from Libreville (Charbonnages, Okala, Owendo)',
      allRoutesBtn: 'All routes',
      seatsUnit: 'seats',
      galleryTitle: 'Gabon Photo Gallery',
      gallerySubtitle: 'Landscapes, wildlife and trail shots shared by explorers',
      galleryCta: 'Open gallery',
    },
    weather: {
      title: 'National Parks Live Weather',
      subtitle: 'Real-time conditions · Open-Meteo Gabon',
      liveTag: 'Live',
      cachedTag: 'Cached',
      refreshTooltip: 'Refresh national parks weather',
      errorMsg: 'Unable to reach weather service (check your connection).',
      retryBtn: 'Retry',
      loadingText: 'Loading weather across Gabon parks...',
      feelsLike: 'Feels like',
      humidity: 'Humidity',
      wind: 'Wind',
      precip: 'Precip.',
      forecast4Days: '4-day forecast',
      parkNames: {
        mondah: { name: 'Mondah National Park', shortName: 'Mondah', region: 'Estuaire · Cap Estérias' },
        loango: { name: 'Loango National Park', shortName: 'Loango', region: 'Ogooué-Maritime · Iguéla' },
        lope: { name: 'Lopé National Park', shortName: 'La Lopé', region: 'Ogooué-Ivindo · UNESCO' },
        pongara: { name: 'Pongara National Park', shortName: 'Pongara', region: 'Estuaire · Nyonié' },
        ivindo: { name: 'Ivindo National Park', shortName: 'Ivindo', region: 'Makokou · Kongou Falls' },
        cristal: { name: 'Crystal Mountains Nat. Park', shortName: 'Crystal Mts', region: 'Woleu-Ntem · Kinguélé' },
      },
    },
    explorer: {
      title: 'Trails & National Parks Map',
      subtitle: 'Real GPS tracks, ANPN markers & live geolocation',
      trackerBtn: 'Tracker',
      offlineModeBtn: 'Offline Mode',
      offlineModeActive: 'Offline Active',
      offlineManageBtn: 'Download / Manage',
      offlineBarTitle: 'Offline Park Maps (LocalStorage)',
      offlineBarHint: 'View GPS trails and ANPN ranger posts even without internet.',
      offlineSavedCount: 'maps saved locally',
      offlineConsultBtn: 'View offline',
      offlineDownloadNowBtn: 'Download this map',
      offlineMissingNotice: 'This park map has not been saved to LocalStorage yet.',
      offlineLegendLabel: 'LocalStorage Offline Map',
      filterAll: '🗺️ All Parks',
      filterMondah: '🌿 Mondah',
      filterIvindo: '🌊 Ivindo (Djidji)',
      filterDenis: '🏖️ Pongara / Denis',
      filterCristal: '⛰️ Crystal Mts',
      filterLoango: '🐘 Loango',
      filterLope: '🏞️ Lopé',
    },
    sorties: {
      title: 'Gabon Expeditions Calendar',
      subtitle: 'Guided bivouacs led by certified eco-guides and clubs',
      communityBtn: 'Community',
      catAll: 'All Trips',
      catPublic: 'Public Hike',
      catPrivate: 'Private Exp.',
      catInstitutional: 'Eco-Volunteering',
      distance: 'Distance',
      elevation: 'Elevation',
      duration: 'Duration',
      passBtn: 'Expedition Pass (Multi-Service Cart)',
      validated: 'Completed',
    },
    equipement: {
      title: 'Gabon Outdoor Gear Marketplace',
      subtitle: 'New gear, MANGOREMA collection & Libreville bivouac rentals',
      cartBtn: 'Cart',
      shopTab: 'Shop',
      rentalTab: 'Rentals',
      shopSearchPlaceholder: 'Search boots, headlamps, flasks, binoculars...',
      rentalSearchPlaceholder: 'Search tents, 65L packs, MTBs, GPS beacons...',
      viewCart: 'View cart',
      partnerStores: 'Partner Stores',
      showAll: 'Show all',
      emptyProducts: 'No equipment matches your search.',
      officialBadge: 'Official',
      stockLabel: 'Stock:',
      outOfStock: 'Sold out',
      pickup: 'Pickup',
      delivery: 'Delivery',
      addToCart: 'Add',
      outOfStockShort: 'Out',
      addedProductToast: 'added to cart',
      addedRentalToast: 'added to cart',
      cautionBannerTitle: 'Protected deposits & photo check-in',
      cautionBannerDesc: 'Pickup: Charbonnages · Batterie 4 · Akanda · Port-Môle',
      checklistBtn: 'Checklist',
      perDay: '/ day',
      availableSuffix: 'avail.',
      full: 'Booked',
      pickupLabel: 'Pickup',
      durationLabel: 'Duration',
      daysUnit: 'd',
      depositLabel: 'Deposit:',
      unavailable: 'Unavailable',
      rentLabel: 'Rent',
      categories: {
        all: 'All',
        randonnee: 'Hiking',
        camping: 'Camping',
        chaussures_vetements: 'Apparel',
        optique_photo: 'Optics & Photo',
        eclairage_gadgets: 'Lighting & Tech',
        lifestyle_mangorema: 'MANGOREMA Official',
      },
    },
    transports: {
      title: 'MANGOREMA Logistics & Shuttles',
      subtitle: 'Shared rides departing from Libreville’s main hubs',
      filterAll: 'All Routes',
      filterBus: '15-Seat Bus',
      filter4x4: '4x4 Off-Road',
      filterBoat: 'Boat / Pirogue',
      safetyTitle: 'Certified & Insured Fleet',
      safetyDesc: 'Inspected vehicles, SOLAS life jackets on water, drivers experienced on Gabonese forest tracks.',
      rentalTitle: 'MANGOREMA Gear Rentals',
      rentalDesc: 'Bivouac tents, 65L packs, expedition MTBs and GPS beacons',
      rentBtn: 'Rent',
      perPerson: 'per person round-trip',
      fleetTitle: 'Live fleet occupancy',
      openSeatsLabel: 'seats open',
      avgOccupancyLabel: 'Average load',
      liveOccupancy: 'Occupancy rate',
      seatsBookedLabel: 'booked',
      seatsFreeLabel: 'open',
      statusAvailable: 'Seats available',
      statusFillingFast: 'Filling fast',
      statusLastSeats: 'Last seats',
      statusFull: 'Sold out',
      meetingPoint: 'Meeting point',
      destinationLabel: 'Park / beach destination',
      departureLabel: 'Departs',
      returnLabel: 'Return',
      driverLabel: 'Driver',
      alertH1: '1h Alert',
      addCartBtn: 'Cart',
      reserveBtn: 'Book',
      emptyFilterTitle: 'No shuttles match this filter',
      resetFilterBtn: 'Show all routes',
    },
    safety: {
      title: 'Trail Safety & ANPN Alerts',
      subtitle: 'Hazard alerts, river floods, wildlife notices and Gabonese ranger network',
      beaconKicker: 'DIGITAL EMERGENCY BEACON',
      beaconTitle: 'DISPATCH ANPN RESCUE',
      beaconDesc: 'Instantly sends your GPS coordinates via satellite SMS to the nearest ranger station.',
      beaconBtn: 'Open SOS Beacon',
      activeIncidentsTitle: 'Active Field Alerts',
      verifiedAnpn: 'ANPN Verified',
      userReport: 'User report',
      reportedAt: 'Reported:',
    },
    profile: {
      cloudActive: '✓ Google & Firestore Sync Active',
      cloudActiveDesc: 'Tickets, favorites & stats backed up in the cloud',
      cloudInactive: 'Cloud Backup (Firebase)',
      cloudInactiveDesc: 'Connect your Google account to sync your tickets',
      metricKm: 'Kilometers',
      metricAscent: 'Elevation',
      metricSteps: 'Forest Steps',
      appearanceTitle: 'Appearance & Dark Mode',
      modeAuto: 'Auto',
      modeDark: 'Dark',
      modeLight: 'Light',
      modeAutoTimeLabel: 'Auto (Schedule)',
      switchToLight: 'Light Mode',
      switchToDark: 'Dark Mode',
      tabApercu: 'Overview & Adventures',
      tabContributions: 'Site Contributions & Photos',
      tabChat: 'Private Chat',
      tabBillets: 'Tickets & Orders',
      tabParametres: 'Settings & Tools',
      editProfileBtn: 'Edit profile',
      emptyBioHint: 'Add a bio and favorite park to introduce yourself to explorers and guides.',
      contributionSingular: 'site contribution',
      contributionPlural: 'site contributions',
      proStoreTitle: 'Professional & Store Modes',
      proStoreSubtitle: 'Dedicated workspaces · 90% partner payout',
      quickPortal: 'Quick portal',
      proVersionTitle: 'Professional Mode',
      proVersionDesc: 'ANPN Guides, Ornithologists, Botanists, Trackers',
      storeVersionTitle: 'Store Mode',
      storeVersionDesc: 'Outdoor Shop, Inventory & Rentals',
      communityHubTitle: 'Community & Interactions',
      contribCardTitle: 'Contribute & Site Photos',
      contribCardDescSuffix: 'post(s) across Gabon parks',
      chatCardTitle: 'Open Private Chat',
      chatCardDescSuffix: 'direct 1-on-1 conversation(s)',
      offlinePendingSuffix: 'field record(s) queued offline',
      autoSyncLabel: 'Auto-sync',
      allExplorers: 'All explorers',
      myContributions: 'My contributions',
      top3Title: 'Top 3 Completed Expeditions',
      top3ChosenSuffix: 'selected',
      top3Subtitle: 'Highlight your favorite shots at the top of your profile',
      chooseBtn: 'Choose',
      doneBtn: 'Done',
      targetSlotLabel: 'Target slot:',
      clearSlot: 'Clear Slot',
      slotLabel: 'Slot',
      emptySlot: 'Empty slot',
      allExpeditionsFilter: 'All expeditions',
      importDevicePhoto: 'Import photo from device',
      anpnCertified: 'Certified Gabon expeditions (ANPN)',
      editSelection: 'Edit selection →',
      favPhotosTitle: 'My Favorite Photos',
      favPhotosSubtitle: 'Your best memories in the Gabonese rainforest',
      noFavPhotos: 'No favorite photos selected yet',
      noFavPhotosHint: 'Tap here to choose up to 6 trail photos or upload new ones.',
      expeditionPrefix: 'Expedition:',
      editTop3: 'Edit my Top 3',
      allPhotos: 'All photos',
      unifiedOrdersTitle: 'Unified Orders & Store',
      logisticsLabel: 'Logistics:',
      receiptLabel: 'Receipt:',
      depositShort: 'Deposit',
      confirmUssd: 'Confirm USSD',
      requestRefund: 'Request refund',
      passesTitle: 'My Tickets & Electronic Passes',
      gmailEmails: 'Gmail Emails',
      h1Alerts: 'H-1 Alerts',
      syncAllIcs: 'Sync all (.ics)',
      noPasses: 'No active tickets yet. Book an expedition to unlock your secure QR Pass.',
      passDetails: 'Pass details',
      shareExpedition: 'Share expedition',
      icsDownloaded: '.ics file downloaded',
      addToCalendar: 'Add to calendar (.ics)',
      googleCalendar: 'Google Calendar',
      icsFormatNote: '.ics format (Apple & Google)',
      h1ReminderTitle: 'H-1 departure reminder',
      h1ReminderDesc: 'Local notification 1h before shuttle / departure (Web API)',
      testH1: 'Test H-1',
      active: 'Active',
      inactive: 'Off',
      badgesTitle: 'Unlocked Ecotourism Badges',
      ecoPointsCumulative: 'cumulative eco pts',
      badgesGalleryBtn: 'Badges Gallery',
      clubTitle: 'MANGOREMA Club Subscriptions',
      clubActive: '✓ Active',
      clubWithAds: 'With partner ads',
      clubNoAds: 'Ad-free experience',
      clubFreeName: 'Free',
      clubStarterName: 'Starter',
      clubMediumName: 'Medium',
      clubProName: 'Pro Expé',
      perMonth: '/mo',
      offlineMapsTitle: 'Offline Map Tiles (OpenStreetMap)',
      offlineMapsSubtitle: 'Local tile storage for 4G-free forest navigation',
      manageBtn: 'Manage',
      browserStorageLabel: 'Browser local storage:',
      packsReadySuffix: 'pack(s) ready',
      actionH1Title: 'Local H-1 Departure Alerts (Web Notification)',
      configure: 'Configure',
      actionOfflineTitle: 'Offline Map Packs (OpenStreetMap Tiles)',
      download: 'Download',
      actionChecklist: 'My Equatorial Bivouac Checklist',
      actionMobileGuide: 'Mobile App Guide (Capacitor / PWA / Android)',
      actionReplayIntro: 'Replay MANGOREMA Intro',
      themeScheduleTitle: 'Automatic schedule (local time)',
      lightFrom: '☀️ Light mode from:',
      darkFrom: '🌙 Dark mode from:',
      nextSwitch: 'Next switch:',
      manualActive: 'Manual mode active (overrides schedule)',
      dayBadge: '☀️ Day',
      nightBadge: '🌙 Night',
      editModalTitle: 'Edit Explorer Profile',
      editModalSubtitle: 'Synced with your public card & private chat profile',
      avatarLabel: 'Profile photo',
      avatarHelper: 'Take a selfie or pick from gallery',
      displayNameLabel: 'Display name',
      roleLabel: 'Role / Specialty',
      rolePlaceholder: 'E.g., Gabon Ecotourist, Photographer...',
      cityLabel: 'City / Base',
      cityPlaceholder: 'E.g., Libreville, Port-Gentil...',
      favoriteParkLabel: 'Favorite park',
      phonePrivateLabel: 'Mobile Money Phone (private, never shown publicly)',
      bioLabel: 'Explorer bio',
      bioPlaceholder: 'Share your favorite parks and interests (bivouac, birding, hiking)...',
      discoverableTitle: 'Visible in Private Chat directory',
      discoverableDesc: 'Your email and phone number always remain strictly private.',
      saveProfileBtn: 'Save profile',
      savingError: 'Unable to save profile.',
      nameMinError: 'Please enter your display name (at least 2 characters).',
    },
    contributions: {
      kicker: 'Field Notes & Community Scouting',
      title: 'Gabon Sites Contributions & Photos',
      subtitle: 'Share your photos, trail conditions and wildlife sightings directly across Gabon national parks.',
      ctaAdd: 'Contribute · Add a photo',
      allSites: 'All sites',
      emptyTitle: 'No photos or contributions on this site yet',
      emptyDescPrefix: 'Be the first to document trails, wildlife or viewpoints in',
      emptyAllParks: 'Gabon national parks',
      addFirstPhoto: 'Add the first photo',
      spotBadge: 'Field note',
      messageBtn: 'Message',
      contributedOnPrefix: 'Contributed on',
      writeToPrefix: 'Message',
      publishedBy: 'Posted by',
      modalTitle: 'Contribute to a Gabon site',
      modalSubtitlePrefix: 'Posted as',
      modalSubtitleSuffix: 'Visible to the community',
      authPrompt: 'Sign in with your Google account to add photos and field notes.',
      siteLabel: 'Site or National Park',
      typeLabel: 'Contribution type',
      shortTitleLabel: 'Short title',
      shortTitlePlaceholder: 'E.g., Sunrise over the lagoon',
      zoneLabel: 'Sector / Specific spot (optional)',
      zonePlaceholder: 'E.g., North Botanical Trail',
      descLabel: 'Observation & field notes',
      descPlaceholder: 'Share trail conditions, wildlife spotted, best time to visit or gear tips...',
      photoRecommended: 'Site photo (recommended)',
      photoOptional: 'Illustrative photo (optional)',
      publishBtn: 'Publish to site',
      errAuth: 'Sign in with Google to post site contributions.',
      errTitle: 'Please enter a short title (at least 2 characters).',
      errDesc: 'Please add a field description or observation.',
      errPhotoRequired: 'Please attach a photo or switch type to Observation / Trail tip.',
      types: {
        PHOTO: { label: 'Site photo', shortLabel: 'Photo' },
        OBSERVATION: { label: 'Wildlife & flora observation', shortLabel: 'Observation' },
        TRAIL_TIP: { label: 'Trail condition & tip', shortLabel: 'Trail tip' },
        CAMP_INFO: { label: 'Access & bivouac info', shortLabel: 'Bivouac' },
      },
    },
    chat: {
      authTitle: 'MANGOREMA 1-on-1 Private Messaging',
      authDesc: 'Sign in with Google to message site contributors privately, coordinate a 4x4 ride or reach a certified ANPN guide.',
      sidebarTitle: 'Private Messages',
      discussionSingular: 'chat',
      discussionPlural: 'chats',
      realtimeLabel: 'Real-time',
      newBtn: 'New',
      discussionsBtn: 'Chats',
      searchContactsPlaceholder: 'Search an explorer or guide...',
      searchChatsPlaceholder: 'Filter conversations...',
      reachableTitle: 'Reachable Explorers & Guides',
      noContacts: 'No other public profiles available yet. Signed-in members appear here automatically.',
      memberFallback: 'MANGOREMA Member',
      youPrefix: 'You:',
      emptySelectionTitle: 'Select a private conversation',
      emptySelectionDesc: 'Pick a thread on the left or tap "New" to message an explorer or guide in Gabon.',
      browseMembersBtn: 'Browse members',
      privateThreadFallback: 'Direct private chat',
      loadingMessages: 'Loading private messages...',
      threadStartPrefix: 'Start of your private chat with',
      threadPrivacyNotePrefix: 'Only you and',
      threadPrivacyNoteSuffix: 'can read this conversation.',
      attachPhotoAria: 'Attach a photo',
      inputPlaceholderPrefix: 'Private message to',
      sendBtn: 'Send',
      sendError: 'Unable to send message.',
      backAria: 'Back to conversations',
    },
    media: {
      defaultLabel: 'Field photo',
      defaultHelper: 'Live camera or gallery · Auto JPEG compression',
      cameraUnavailable: 'Camera unavailable in this browser. Use Gallery / File.',
      cameraDenied: 'Camera permission denied or device busy. Pick a photo from your device.',
      captureError: 'Unable to capture frame. Please try again.',
      invalidFile: 'Please select a valid image file (JPG, PNG, WebP).',
      processError: 'Error processing the selected photo.',
      switchCamera: 'Flip',
      captureBtn: 'Capture',
      closeCameraAria: 'Close camera',
      readyLabel: 'Ready',
      changeBtn: 'Change',
      removeAria: 'Remove photo',
      takePhotoBtn: 'Take photo',
      galleryBtn: 'Gallery / File',
      uploadingCloud: 'Uploading securely to Cloud...',
    },
    community: {
      modalTitle: 'MANGOREMA Community & Chat',
      modalSubtitle: 'Publish activities, comment & message live',
      activitiesTab: 'Activities',
      chatTab: 'Live Chat',
      authRequiredStrong: 'Google Sign-In required',
      authRequiredRest: 'to read, publish, comment and chat with other explorers.',
      feedTitle: 'Gabon Field Feed',
      publishToggle: 'Publish activity',
      hideForm: 'Hide',
      parkLabel: 'Park / Zone',
      typeLabel: 'Activity type',
      titleLabel: 'Trip title',
      titlePlaceholder: 'E.g., Morning loop in Mondah Forest',
      descLabel: 'Field notes',
      descPlaceholder: 'Trail condition, weather, wildlife spotted, tips for upcoming hikers...',
      distancePlaceholder: 'Distance (km, opt.)',
      elevationPlaceholder: 'Elevation +m (opt.)',
      photoPlaceholder: 'Photo URL (https://..., optional)',
      emptyTitleSignedIn: 'No activities published yet.',
      emptyTitleSignedOut: 'Sign in with Google to view and share field activities.',
      emptySubtitle: 'Share your latest forest hike, wildlife sighting, or bivouac to start the conversation.',
      bravo: 'Bravo',
      comments: 'Comments',
      noComments: 'No comments yet. Be the first to reply!',
      commentPlaceholder: 'Comment on activity by',
      signInToComment: 'Sign in with Google to comment',
      roomReadySuffix: 'channel ready for chat',
      roomReadyDesc: 'Ask about trail conditions, coordinate a 4x4 carpool or share a live weather notice.',
      chatPlaceholderPrefix: 'Message in',
      signInToChat: 'Sign in with Google to chat live',
      you: 'You',
      activityTypes: {
        RANDONNEE: 'Hiking',
        FAUNE: 'Wildlife & Flora',
        BIVOUAC: 'Bivouac',
        ECO_ACTION: 'Eco-Action',
      },
    },
    gallery: {
      kicker: 'Mangorema Phototheque · Parks & Expeditions',
      title: 'Gabon Photo Gallery',
      subtitle: 'Equatorial landscapes, bivouac memories and field photos shared by explorers across protected sites.',
      addPhotoBtn: 'Add photo',
      totalPhotosLabel: 'Photos',
      parksCoveredLabel: 'Sites featured',
      favoritesLabel: 'Favorites',
      filterAll: 'All',
      filterLandscapes: 'Landscapes',
      filterExpeditions: 'Expeditions',
      filterCommunity: 'Community',
      filterFavorites: 'My favorites',
      allSitesOption: 'All Gabon sites',
      searchPlaceholder: 'Search a park, title, or explorer...',
      viewGridAria: 'Editorial grid view',
      viewCompactAria: 'Compact mosaic view',
      emptyTitle: 'No photos match these filters',
      emptySubtitle: 'Adjust your search or upload your first shot from a Gabon national park.',
      resetFilters: 'Reset filters',
      sourceLandscape: 'Official backdrop',
      sourceExpedition: 'Expedition',
      sourceCommunity: 'Field · Community',
      sourceReview: 'Traveler review',
      favoriteAdd: 'Add to favorites',
      favoriteRemove: 'Remove from favorites',
      applyBackdrop: 'Use as app backdrop',
      backdropApplied: 'Active backdrop',
      contactAuthor: 'Message privately',
      openLightboxAria: 'Enlarge photo',
      prevPhotoAria: 'Previous photo',
      nextPhotoAria: 'Next photo',
      downloadPhoto: 'Download',
      featuredTag: 'Featured',
      uploadModalTitle: 'Publish a photo to the gallery',
      uploadModalSubtitle: 'Share a shot with the community on a Gabon site or save it to your personal album.',
      uploadDestSite: 'Gabon Site (Public Cloud)',
      uploadDestPersonal: 'My Expedition Album',
      titleLabel: 'Photo title',
      titlePlaceholder: 'E.g. Sunrise over Iguéla Lagoon',
      parkLabel: 'Gabon Park / Site',
      captionLabel: 'Caption or field note',
      captionPlaceholder: 'Describe the moment, trail condition, or wildlife spotted...',
      submitBtn: 'Publish to gallery',
      errMissingImage: 'Please capture or select an image.',
      errMissingTitle: 'Please enter a title for your photo.',
      errSignInSite: 'Sign in with Google to publish to a public site, or select "My Expedition Album".',
      toastBackdropTitle: 'Backdrop updated',
      toastBackdropDesc: 'Frosted glass background now shows:',
      toastPersonalTitle: 'Photo added to gallery',
      toastPersonalDesc: 'Your photo has been saved to your expedition album & favorites.',
    },
    favoriteModal: {
      kicker: 'GABON EXPEDITIONS GALLERY',
      title: 'Choose My Favorite Photos',
      subtitleTitle: 'Select your top highlights',
      subtitleHint: 'They will appear as a showcase on your explorer profile (max 6).',
      tabAll: 'All',
      tabFavorites: 'Favorites',
      tabUpload: 'Add photo',
      maxSixError: 'You can select up to 6 favorite photos to showcase on your profile.',
      invalidFormatError: 'Unsupported format. Choose a JPG, PNG, WEBP or GIF image.',
      tooLargeError: 'Image is too large (maximum 6 MB).',
      corruptFileError: 'Invalid or corrupted image file.',
      missingImageError: 'Please choose an image from your device or enter an image URL.',
      invalidUrlError: 'Invalid image URL. Use an https:// link or a JPG/PNG/WEBP file.',
      missingTitleError: 'Please provide a title for your photo.',
      defaultCaption: 'Personal photo added to my MANGOREMA expedition logbook.',
      removeFavTitle: 'Remove from favorites',
      addFavTitle: 'Add to favorites',
      zoomTitle: 'Enlarge',
      chooseFileBtn: 'Choose a photo from my device',
      supportedFormats: 'Supported formats: JPG, PNG, WEBP',
      orUrlLabel: 'Or enter an image web address (URL):',
      titleLabel: 'Photo title:',
      titlePlaceholder: 'E.g. Bivouac evening at Cap Estérias',
      parkLabel: 'Park / Place in Gabon:',
      captionLabel: 'Caption / Trail story:',
      captionPlaceholder: 'A few words about this highlight...',
      saveUploadBtn: 'Save & add to favorites',
      validateSelectionBtn: 'Confirm selection',
      addToFavBtn: 'Add to favorite photos',
      removeFromFavBtn: 'Remove from favorite photos',
    },
    ads: {
      sponsoredLabel: 'Sponsored',
      hideAdTitle: 'Hide this ad',
      codePrefix: 'Code',
      removeAdsBtn: 'Go ad-free',
      promoCodeLabel: 'Partner promo code',
      copyBtn: 'Copy',
      copiedLabel: 'Copied',
      freeTierNotice: 'Sponsored offers appear only on the Free version of MANGOREMA.',
      planUpdatedToastTitle: 'MANGOREMA Plan Updated',
      planFreeToastDesc: 'Free version active (with local Gabon partner ads).',
      planPaidToastDesc: 'Ad-free experience enabled for your account.',
    },
  },
  ar: {
    language: {
      sectionTitle: 'لغة التطبيق',
      sectionSubtitle: 'اختر لغة العرض المفضلة (الفرنسية أو الإنجليزية أو العربية)',
      rtlBadge: 'الاتجاه من اليمين لليسار',
      ltrBadge: 'الاتجاه من اليسار لليمين',
      toastTitle: 'تم تحديث اللغة',
      toastDesc: 'تم تحويل الواجهة إلى اللغة العربية.',
      switchTooltip: 'تغيير اللغة (FR / EN / AR)',
    },
    nav: {
      accueil: 'الرئيسية',
      explorer: 'استكشاف',
      sorties: 'المغامرات',
      equipement: 'المعدات',
      transports: 'النقل',
      safety: 'السلامة',
      galerie: 'المعرض',
      profil: 'حسابي',
    },
    header: {
      tagline: 'اعرف لتُحسن الحماية',
      offline: 'غير متصل',
      app: 'التطبيق',
      sos: 'طوارئ',
      galleryTooltip: 'معرض صور ومناظر الغابون',
      privateChatTooltip: 'الرسائل الخاصة 1-إلى-1',
      communityTooltip: 'مجتمع المستكشفين والدردشة المباشرة',
      notificationsTooltip: 'تنبيهات المغادرة قبل ساعة',
      cartTooltip: 'السلة الموحدة والدفع الإلكتروني',
    },
    workspace: {
      explorer: 'مستكشف',
      professional: 'محترف ومرشد',
      store: 'متجر وتأجير',
      explorerSub: 'استكشاف وحجز وتأجير في الغابون',
      professionalSub: 'مرشدون، علماء طيور ونباتات وخبراء',
      storeSub: 'متجر المعدات والمخزون والتأجير',
      switchTitle: 'نسخة تطبيق MANGOREMA',
      backToExplorer: 'وضع المستكشف',
      landscapeLabel: 'الخلفية:',
      landscapeTooltip: 'اختر منظرًا طبيعيًا من الغابون للخلفية',
      landscapeAutoTitle: 'أجواء ديناميكية',
      landscapeAutoDesc: 'تتغير تلقائيًا مع كل تبويب',
      proTabs: {
        dashboard: 'لوحة المحترف',
        offers: 'الرحلات',
        bookings: 'المهام',
        profile: 'ملف ANPN',
      },
      storeTabs: {
        dashboard: 'الصندوق',
        catalog: 'المتجر',
        rentals: 'التأجير',
        orders: 'الطلبات',
        profile: 'المحل',
      },
    },
    common: {
      offlineBanner: 'وضع عدم الاتصال: يتم تحميل الخرائط والتذاكر من الذاكرة المحلية.',
      free: 'مجاني',
      seeAll: 'عرض الكل',
      cancel: 'إلغاء',
      publish: 'نشر',
      close: 'إغلاق',
      connectGoogle: 'تسجيل الدخول عبر Google',
      signIn: 'دخول',
      signOut: 'خروج',
      onlineLabel: 'متصل',
    },
    home: {
      heroBadge: 'تطبيق الغابون الشامل · سياحة بيئية',
      heroTitle: 'عِش الغابون في قلب الطبيعة.',
      heroSubtitle:
        'رحلات مشي، مركبات دفع رباعي مشتركة، تخييم ومرشدو ANPN بالدفع الفوري عبر Airtel و Moov Money و GhettoPay.',
      statHikers: 'متنزهون',
      statParksCount: '13 محمية',
      statParks: 'محميات الغابون',
      statMobileMoney: 'دفع إلكتروني',
      quickGps: 'متتبع GPS',
      quickShuttles: 'الحافلات',
      quickChecklist: 'قائمة العتاد',
      quickSos: 'تنبيه طوارئ',
      universeTitle: 'مجالات أنشطة MANGOREMA',
      universeSubtitle: '4 أقطاب · الغابون',
      poleExpeditions: 'الرحلات',
      hubSubExpeditions: 'محميات ومسارات',
      poleShuttles: 'النقل',
      hubSubShuttles: 'دفع رباعي وقوارب',
      poleRental: 'التأجير',
      hubSubGear: 'شراء وتأجير',
      poleGuides: 'المرشدون',
      hubSubGuides: 'خرائط وخبراء',
      ecoTitle: 'تحديات بيئية بلا نفايات',
      ecoDesc: 'وثّق رحلاتك النظيفة واحصل على شارات بيئية رقمية متزامنة مع Firebase.',
      ecoPointsUnit: 'نقطة بيئية',
      ecoCleanParks: 'حدائق نظيفة',
      ecoBadgesBtn: 'الشارات',
      ecoJoinBtn: 'مشاركة',
      communityTitle: 'مجتمع المستكشفين والدردشة',
      communityDesc:
        'انشر أنشطتك الميدانية، علّق على اكتشافات الآخرين وتواصل مباشرة حسب المحمية.',
      communityPostsUnit: 'منشور',
      communityPublishCommentBtn: 'نشر / تعليق',
      communityChatBtn: 'دردشة مباشرة',
      rentalBadge: 'تأجير MANGOREMA',
      rentalVerified: '✓ تأمين Mobile Money',
      rentalTitle: 'تأجير معدات التخييم والطبيعة',
      rentalDesc: 'خيام مقاومة للمطر، حقائب 65 لتر، دراجات جبلية وأجهزة تتبع Garmin InReach.',
      rentalPickup: 'الاستلام: Charbonnages · Batterie 4 · Akanda',
      rentalCta: 'استئجار معدات',
      rentalChecklistBtn: 'قائمة العتاد',
      rentalStoreCta: 'المتجر والتأجير',
      featuredTitle: 'رحلات مميزة في الغابون',
      organizerPrefix: 'المنظم:',
      bookCartBtn: 'احجز الآن',
      shuttlesBannerTitle: 'نقل مشترك MANGOREMA',
      shuttlesBannerDesc: 'انطلاقات منتظمة من ليبرفيل (Charbonnages، Okala، Owendo)',
      allRoutesBtn: 'جميع المسارات',
      seatsUnit: 'مقاعد',
      galleryTitle: 'معرض صور الغابون',
      gallerySubtitle: 'مناظر طبيعية، حياة برية ولقطات المستكشفين الميدانية',
      galleryCta: 'فتح المعرض',
    },
    weather: {
      title: 'طقس المحميات الوطنية',
      subtitle: 'الأحوال الجوية المباشرة · Open-Meteo الغابون',
      liveTag: 'مباشر',
      cachedTag: 'محفوظ محليًا',
      refreshTooltip: 'تحديث طقس المحميات الوطنية',
      errorMsg: 'تعذر الاتصال بخدمة الطقس (تحقق من الاتصال بالإنترنت).',
      retryBtn: 'إعادة المحاولة',
      loadingText: 'جاري تحميل الطقس في محميات الغابون...',
      feelsLike: 'المحسوسة',
      humidity: 'الرطوبة',
      wind: 'الرياح',
      precip: 'الأمطار',
      forecast4Days: 'توقعات 4 أيام',
      parkNames: {
        mondah: { name: 'محمية موندا الوطنية', shortName: 'موندا', region: 'إستوير · كاب إستيرياس' },
        loango: { name: 'محمية لوانغو الوطنية', shortName: 'لوانغو', region: 'أوغوي البحرية · إيغويلا' },
        lope: { name: 'محمية لوبي الوطنية', shortName: 'لوبي', region: 'أوغوي-إيفيندو · اليونسكو' },
        pongara: { name: 'محمية بونغارا الوطنية', shortName: 'بونغارا', region: 'إستوير · نيونيي' },
        ivindo: { name: 'محمية إيفيندو الوطنية', shortName: 'إيفيندو', region: 'ماكوكو · شلالات كونغو' },
        cristal: { name: 'محمية جبال الكريستال', shortName: 'جبال الكريستال', region: 'ووليو-نتم · كينغويلي' },
      },
    },
    explorer: {
      title: 'خرائط المسارات والمحميات الوطنية',
      subtitle: 'مسارات GPS حقيقية وعلامات ANPN والموقع المباشر',
      trackerBtn: 'المتتبع',
      offlineModeBtn: 'وضع عدم الاتصال',
      offlineModeActive: 'دون اتصال نشط',
      offlineManageBtn: 'تحميل / إدارة',
      offlineBarTitle: 'خرائط دون اتصال (LocalStorage)',
      offlineBarHint: 'تصفح مسارات GPS ومراكز حراس ANPN حتى بدون إنترنت.',
      offlineSavedCount: 'خرائط محفوظة محليًا',
      offlineConsultBtn: 'عرض دون اتصال',
      offlineDownloadNowBtn: 'تحميل هذه الخريطة',
      offlineMissingNotice: 'لم يتم تنزيل خريطة هذه المحمية في الذاكرة المحلية بعد.',
      offlineLegendLabel: 'خريطة محلية LocalStorage',
      filterAll: '🗺️ جميع المحميات',
      filterMondah: '🌿 موندا',
      filterIvindo: '🌊 إيفيندو',
      filterDenis: '🏖️ بونغارا / دينيس',
      filterCristal: '⛰️ جبال الكريستال',
      filterLoango: '🐘 لوانغو',
      filterLope: '🏞️ لوبي',
    },
    sorties: {
      title: 'تقويم الرحلات الاستكشافية في الغابون',
      subtitle: 'تخييم مؤطر من قبل مرشدين بيئيين وأندية معتمدة',
      communityBtn: 'المجتمع',
      catAll: 'كل الرحلات',
      catPublic: 'رحلة عامة',
      catPrivate: 'رحلة خاصة',
      catInstitutional: 'تطوع بيئي',
      distance: 'المسافة',
      elevation: 'الارتفاع',
      duration: 'المدة',
      passBtn: 'تذكرة الرحلة (سلة الخدمات المتعددة)',
      validated: 'مكتمل',
    },
    equipement: {
      title: 'سوق معدات الطبيعة في الغابون',
      subtitle: 'معدات جديدة، تشكيلة MANGOREMA وتأجير التخييم في ليبرفيل',
      cartBtn: 'السلة',
      shopTab: 'المتجر',
      rentalTab: 'التأجير',
      shopSearchPlaceholder: 'ابحث عن أحذية، مصباح، زمزمية، منظار...',
      rentalSearchPlaceholder: 'ابحث عن خيمة، حقيبة 65 لتر، دراجة، جهاز GPS...',
      viewCart: 'عرض السلة',
      partnerStores: 'المتاجر الشريكة',
      showAll: 'عرض الكل',
      emptyProducts: 'لا توجد معدات تطابق بحثك.',
      officialBadge: 'رسمي',
      stockLabel: 'المتوفر:',
      outOfStock: 'نفد المخزون',
      pickup: 'استلام',
      delivery: 'توصيل',
      addToCart: 'أضف',
      outOfStockShort: 'نفد',
      addedProductToast: 'أضيف إلى السلة',
      addedRentalToast: 'أضيف إلى السلة',
      cautionBannerTitle: 'تأمينات محمية ومعاينة بالصور عند الاستلام',
      cautionBannerDesc: 'الاستلام: Charbonnages · Batterie 4 · Akanda · Port-Môle',
      checklistBtn: 'قائمة العتاد',
      perDay: '/ يوم',
      availableSuffix: 'متاح',
      full: 'مكتمل',
      pickupLabel: 'الاستلام',
      durationLabel: 'المدة',
      daysUnit: 'أيام',
      depositLabel: 'التأمين:',
      unavailable: 'غير متاح',
      rentLabel: 'استئجار',
      categories: {
        all: 'الكل',
        randonnee: 'المشي الجبلي',
        camping: 'التخييم',
        chaussures_vetements: 'الأحذية والملابس',
        optique_photo: 'البصريات والتصوير',
        eclairage_gadgets: 'الإضاءة والتقنية',
        lifestyle_mangorema: 'منتجات MANGOREMA الرسمية',
      },
    },
    transports: {
      title: 'لوجستيك ونقل MANGOREMA',
      subtitle: 'رحلات جماعية ومشتركة من المحاور الرئيسية في ليبرفيل',
      filterAll: 'كل المسارات',
      filterBus: 'حافلة 15 مقعد',
      filter4x4: 'دفع رباعي 4x4',
      filterBoat: 'قارب / مركب',
      safetyTitle: 'أسطول معتمد ومؤمّن',
      safetyDesc: 'مركبات مفحوصة، سترات نجاة SOLAS على الماء وسائقون خبراء بمسارات الغابون.',
      rentalTitle: 'تأجير معدات MANGOREMA',
      rentalDesc: 'خيام تخييم، حقائب 65 لتر، دراجات وأجهزة GPS',
      rentBtn: 'استئجار',
      perPerson: 'للشخص ذهابًا وإيابًا',
      fleetTitle: 'إشغال الأسطول الفوري',
      openSeatsLabel: 'مقاعد متاحة',
      avgOccupancyLabel: 'متوسط الإشغال',
      liveOccupancy: 'نسبة الإشغال',
      seatsBookedLabel: 'محجوزة',
      seatsFreeLabel: 'متاحة',
      statusAvailable: 'مقاعد متوفرة',
      statusFillingFast: 'يمتلئ سريعًا',
      statusLastSeats: 'المقاعد الأخيرة',
      statusFull: 'مكتمل',
      meetingPoint: 'نقطة التجمع',
      destinationLabel: 'الوجهة',
      departureLabel: 'الانطلاق',
      returnLabel: 'العودة',
      driverLabel: 'السائق',
      alertH1: 'تنبيه H-1',
      addCartBtn: 'للسلة',
      reserveBtn: 'حجز',
      emptyFilterTitle: 'لا توجد رحلات لهذه الفئة',
      resetFilterBtn: 'عرض كل المسارات',
    },
    safety: {
      title: 'سلامة المسارات ويقظة ANPN',
      subtitle: 'تنبيهات المخاطر، فيضانات الأنهار، الحياة البرية وشبكة الحراس',
      beaconKicker: 'جهاز الطوارئ الرقمي',
      beaconTitle: 'استدعاء إنقاذ ANPN',
      beaconDesc: 'يرسل إحداثيات GPS فورًا عبر رسائل الأقمار الصناعية إلى أقرب مركز حراسة.',
      beaconBtn: 'فتح منارة SOS',
      activeIncidentsTitle: 'التنبيهات الميدانية النشطة',
      verifiedAnpn: 'مؤكد ANPN',
      userReport: 'بلاغ مستخدم',
      reportedAt: 'وقت البلاغ:',
    },
    profile: {
      cloudActive: '✓ مزامنة Google و Firestore نشطة',
      cloudActiveDesc: 'التذاكر والمفضلة والإحصاءات محفوظة سحابيًا',
      cloudInactive: 'النسخ الاحتياطي السحابي (Firebase)',
      cloudInactiveDesc: 'اربط حساب Google الخاص بك لحفظ التذاكر',
      metricKm: 'كيلومتر',
      metricAscent: 'صعود',
      metricSteps: 'خطوة غابية',
      appearanceTitle: 'المظهر والوضع الداكن',
      modeAuto: 'تلقائي',
      modeDark: 'داكن',
      modeLight: 'فاتح',
      modeAutoTimeLabel: 'تلقائي (حسب الوقت)',
      switchToLight: 'الوضع الفاتح',
      switchToDark: 'الوضع الداكن',
      tabApercu: 'نظرة عامة والمغامرات',
      tabContributions: 'مساهمات وصور المواقع',
      tabChat: 'الدردشة الخاصة',
      tabBillets: 'التذاكر والطلبات',
      tabParametres: 'الإعدادات والأدوات',
      editProfileBtn: 'تعديل الملف الشخصي',
      emptyBioHint: 'أضف نبذة عنك ومحميتك المفضلة للتعريف بنفسك أمام المستكشفين والمرشدين.',
      contributionSingular: 'مساهمة موقع',
      contributionPlural: 'مساهمات مواقع',
      proStoreTitle: 'نسخة المحترفين والمتجر',
      proStoreSubtitle: 'مساحات عمل مخصصة · عائد 90% للشركاء',
      quickPortal: 'بوابة سريعة',
      proVersionTitle: 'نسخة المحترفين',
      proVersionDesc: 'مرشدو ANPN، علماء الطيور والنباتات والمتتبعون',
      storeVersionTitle: 'نسخة المتجر',
      storeVersionDesc: 'متجر الطبيعة وإدارة المخزون والتأجير',
      communityHubTitle: 'المجتمع والتفاعل',
      contribCardTitle: 'المساهمة وصور المواقع',
      contribCardDescSuffix: 'مشاركة في محميات الغابون',
      chatCardTitle: 'فتح الدردشة الخاصة',
      chatCardDescSuffix: 'محادثة مباشرة 1-إلى-1',
      offlinePendingSuffix: 'بيانات ميدانية بانتظار الاتصال',
      autoSyncLabel: 'مزامنة تلقائية',
      allExplorers: 'جميع المستكشفين',
      myContributions: 'مساهماتي',
      top3Title: 'أفضل 3 رحلات منجزة',
      top3ChosenSuffix: 'مختارة',
      top3Subtitle: 'أجمل لقطاتك بارزة في أعلى ملفك الشخصي',
      chooseBtn: 'اختيار',
      doneBtn: 'تم',
      targetSlotLabel: 'الموضع المستهدف:',
      clearSlot: 'إفراغ الموضع',
      slotLabel: 'الموضع',
      emptySlot: 'موضع فارغ',
      allExpeditionsFilter: 'كل الرحلات',
      importDevicePhoto: 'استيراد صورة من الجهاز',
      anpnCertified: 'معتمد لرحلات الغابون (ANPN)',
      editSelection: 'تعديل الاختيار ←',
      favPhotosTitle: 'صوري المفضلة',
      favPhotosSubtitle: 'أجمل ذكرياتك في غابات الغابون',
      noFavPhotos: 'لم يتم اختيار صور مفضلة بعد',
      noFavPhotosHint: 'اضغط هنا لاختيار حتى 6 صور من رحلاتك أو رفع صور جديدة.',
      expeditionPrefix: 'الرحلة:',
      editTop3: 'تعديل أفضل 3',
      allPhotos: 'كل الصور',
      unifiedOrdersTitle: 'الطلبات الموحدة والمتجر',
      logisticsLabel: 'التوصيل:',
      receiptLabel: 'الإيصال:',
      depositShort: 'التأمين',
      confirmUssd: 'تأكيد USSD',
      requestRefund: 'طلب استرداد',
      passesTitle: 'تذاكري وبطاقات المرور الإلكترونية',
      gmailEmails: 'رسائل Gmail',
      h1Alerts: 'تنبيهات H-1',
      syncAllIcs: 'مزامنة الكل (.ics)',
      noPasses: 'لا توجد تذاكر نشطة حاليًا. احجز رحلة للحصول على بطاقة QR الآمنة.',
      passDetails: 'تفاصيل التذكرة',
      shareExpedition: 'مشاركة رحلتي',
      icsDownloaded: 'تم تحميل ملف .ics',
      addToCalendar: 'إضافة للتقويم (.ics)',
      googleCalendar: 'تقويم Google',
      icsFormatNote: 'صيغة .ics (Apple و Google)',
      h1ReminderTitle: 'تذكير قبل الانطلاق بساعة',
      h1ReminderDesc: 'إشعار محلي قبل ساعة من النقل أو الرحلة',
      testH1: 'اختبار التنبيه',
      active: 'مفعّل',
      inactive: 'معطّل',
      badgesTitle: 'شارات السياحة البيئية المفتوحة',
      ecoPointsCumulative: 'نقطة بيئية متراكمة',
      badgesGalleryBtn: 'معرض الشارات',
      clubTitle: 'اشتراكات نادي MANGOREMA',
      clubActive: '✓ نشط',
      clubWithAds: 'مع إعلانات الشركاء',
      clubNoAds: 'بدون إعلانات',
      clubFreeName: 'مجاني',
      clubStarterName: 'Starter',
      clubMediumName: 'Medium',
      clubProName: 'Pro Expé',
      perMonth: '/شهر',
      offlineMapsTitle: 'خرائط دون اتصال (OpenStreetMap)',
      offlineMapsSubtitle: 'تخزين محلي للخرائط للتنقل بدون شبكة 4G',
      manageBtn: 'إدارة',
      browserStorageLabel: 'تخزين المتصفح المحلي:',
      packsReadySuffix: 'حزمة جاهزة',
      actionH1Title: 'تنبيهات المغادرة المحلية قبل ساعة (Web Notification)',
      configure: 'ضبط',
      actionOfflineTitle: 'حزم الخرائط دون اتصال (OpenStreetMap)',
      download: 'تحميل',
      actionChecklist: 'قائمة تجهيزات التخييم الاستوائي',
      actionMobileGuide: 'دليل تطبيق الجوال (Capacitor / PWA / Android)',
      actionReplayIntro: 'إعادة عرض مقدمة MANGOREMA',
      themeScheduleTitle: 'الجدول التلقائي (التوقيت المحلي)',
      lightFrom: '☀️ الوضع الفاتح من:',
      darkFrom: '🌙 الوضع الداكن من:',
      nextSwitch: 'التبديل القادم:',
      manualActive: 'الوضع اليدوي نشط (يتجاوز الجدول الزمني)',
      dayBadge: '☀️ نهار',
      nightBadge: '🌙 ليل',
      editModalTitle: 'تعديل ملف المستكشف',
      editModalSubtitle: 'تتم المزامنة مع بطاقتك العامة وملف الدردشة الخاصة',
      avatarLabel: 'الصورة الشخصية',
      avatarHelper: 'التقط سيلفي أو اختر من المعرض',
      displayNameLabel: 'الاسم الظاهر',
      roleLabel: 'الصفة / التخصص',
      rolePlaceholder: 'مثال: سائح بيئي، مصور طبيعة...',
      cityLabel: 'المدينة / القاعدة',
      cityPlaceholder: 'مثال: ليبرفيل، بورت جنتيل...',
      favoriteParkLabel: 'المحمية المفضلة',
      phonePrivateLabel: 'هاتف Mobile Money (خاص، لا يظهر للعامة)',
      bioLabel: 'نبذة المستكشف',
      bioPlaceholder: 'عرّف بالمحميات المفضلة لديك واهتماماتك (تخييم، طيور، مشي)...',
      discoverableTitle: 'الظهور في دليل الدردشة الخاصة',
      discoverableDesc: 'يبقى بريدك الإلكتروني وهاتفك خاصين تمامًا دائمًا.',
      saveProfileBtn: 'حفظ الملف الشخصي',
      savingError: 'تعذر حفظ الملف الشخصي.',
      nameMinError: 'يرجى إدخال الاسم الظاهر (حرفان على الأقل).',
    },
    contributions: {
      kicker: 'استكشاف ميداني ومساهمات المجتمع',
      title: 'مساهمات وصور مواقع الغابون',
      subtitle: 'شارك صورك وحالة المسارات ومشاهدات الحياة البرية مباشرة في المحميات الوطنية.',
      ctaAdd: 'مساهمة · إضافة صورة',
      allSites: 'جميع المواقع',
      emptyTitle: 'لا توجد صور أو مساهمات لهذا الموقع بعد',
      emptyDescPrefix: 'كن أول من يوثق المسارات أو الحياة البرية أو المناظر في',
      emptyAllParks: 'المحميات الوطنية في الغابون',
      addFirstPhoto: 'أضف أول صورة',
      spotBadge: 'ملاحظة ميدانية',
      messageBtn: 'مراسلة',
      contributedOnPrefix: 'ساهم في',
      writeToPrefix: 'مراسلة',
      publishedBy: 'نشر بواسطة',
      modalTitle: 'المساهمة في موقع بالغابون',
      modalSubtitlePrefix: 'ينشر باسم',
      modalSubtitleSuffix: 'مرئي للمجتمع',
      authPrompt: 'سجّل الدخول بحساب Google لإضافة الصور والملاحظات الميدانية.',
      siteLabel: 'الموقع أو المحمية الوطنية',
      typeLabel: 'نوع المساهمة',
      shortTitleLabel: 'عنوان مختصر',
      shortTitlePlaceholder: 'مثال: شروق الشمس فوق البحيرة',
      zoneLabel: 'القطاع / النقطة (اختياري)',
      zonePlaceholder: 'مثال: المسار النباتي الشمالي',
      descLabel: 'الملاحظات والتفاصيل الميدانية',
      descPlaceholder: 'شارك حالة المسار، الكائنات المرصودة، أفضل توقيت أو نصائح المعدات...',
      photoRecommended: 'صورة الموقع (موصى بها)',
      photoOptional: 'صورة توضيحية (اختيارية)',
      publishBtn: 'نشر على الموقع',
      errAuth: 'سجّل الدخول عبر Google للنشر في مواقع الغابون.',
      errTitle: 'يرجى إدخال عنوان واضح (حرفان على الأقل).',
      errDesc: 'يرجى إضافة وصف أو ملاحظة ميدانية.',
      errPhotoRequired: 'أضف صورة أو غيّر النوع إلى مشاهدة / نصيحة مسار.',
      types: {
        PHOTO: { label: 'صورة الموقع', shortLabel: 'صورة' },
        OBSERVATION: { label: 'رصد الحياة البرية والنباتات', shortLabel: 'رصد' },
        TRAIL_TIP: { label: 'حالة ونصيحة المسار', shortLabel: 'مسار' },
        CAMP_INFO: { label: 'الوصول والتخييم', shortLabel: 'تخييم' },
      },
    },
    chat: {
      authTitle: 'الرسائل الخاصة المباشرة MANGOREMA',
      authDesc: 'سجّل الدخول عبر Google للدردشة الخاصة مع المساهمين في المواقع، تنسيق رحلة 4x4 أو التواصل مع مرشد ANPN معتمد.',
      sidebarTitle: 'الرسائل الخاصة',
      discussionSingular: 'محادثة',
      discussionPlural: 'محادثات',
      realtimeLabel: 'مباشر',
      newBtn: 'جديد',
      discussionsBtn: 'المحادثات',
      searchContactsPlaceholder: 'ابحث عن مستكشف أو مرشد...',
      searchChatsPlaceholder: 'تصفية المحادثات...',
      reachableTitle: 'مستكشفون ومرشدون متاحون',
      noContacts: 'لا توجد ملفات عامة أخرى متاحة حاليًا. يظهر الأعضاء المسجلون هنا تلقائيًا.',
      memberFallback: 'عضو MANGOREMA',
      youPrefix: 'أنت:',
      emptySelectionTitle: 'اختر محادثة خاصة',
      emptySelectionDesc: 'اختر محادثة من القائمة أو اضغط «جديد» لمراسلة مستكشف أو مرشد في الغابون.',
      browseMembersBtn: 'تصفح الأعضاء',
      privateThreadFallback: 'محادثة خاصة مباشرة',
      loadingMessages: 'جاري تحميل الرسائل الخاصة...',
      threadStartPrefix: 'بداية محادثتك الخاصة مع',
      threadPrivacyNotePrefix: 'أنت و',
      threadPrivacyNoteSuffix: 'فقط يمكنكما قراءة هذه المحادثة.',
      attachPhotoAria: 'إرفاق صورة',
      inputPlaceholderPrefix: 'رسالة خاصة إلى',
      sendBtn: 'إرسال',
      sendError: 'تعذر إرسال الرسالة.',
      backAria: 'العودة إلى المحادثات',
    },
    media: {
      defaultLabel: 'صورة ميدانية',
      defaultHelper: 'كاميرا مباشرة أو المعرض · ضغط JPEG تلقائي',
      cameraUnavailable: 'الكاميرا غير متاحة في هذا المتصفح. استخدم المعرض / ملف.',
      cameraDenied: 'تم رفض إذن الكاميرا أو الجهاز مشغول. اختر صورة من جهازك.',
      captureError: 'تعذر التقاط الصورة. حاول مرة أخرى.',
      invalidFile: 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).',
      processError: 'خطأ أثناء معالجة الصورة المختارة.',
      switchCamera: 'تبديل',
      captureBtn: 'التقاط',
      closeCameraAria: 'إغلاق الكاميرا',
      readyLabel: 'جاهزة',
      changeBtn: 'تغيير',
      removeAria: 'إزالة الصورة',
      takePhotoBtn: 'التقاط صورة',
      galleryBtn: 'المعرض / ملف',
      uploadingCloud: 'جاري الرفع الآمن إلى السحابة...',
    },
    community: {
      modalTitle: 'مجتمع ودردشة MANGOREMA',
      modalSubtitle: 'انشر رحلاتك، علّق وتحدث مباشرة',
      activitiesTab: 'الأنشطة',
      chatTab: 'دردشة مباشرة',
      authRequiredStrong: 'تسجيل الدخول عبر Google مطلوب',
      authRequiredRest: 'للقراءة والنشر والتعليق والدردشة مع المستكشفين الآخرين.',
      feedTitle: 'مستجدات الرحلات في الغابون',
      publishToggle: 'نشر نشاط',
      hideForm: 'إخفاء',
      parkLabel: 'المحمية / المنطقة',
      typeLabel: 'نوع النشاط',
      titleLabel: 'عنوان النشاط',
      titlePlaceholder: 'مثال: جولة صباحية في غابة موندا',
      descLabel: 'التقرير الميداني',
      descPlaceholder: 'حالة المسار، الطقس، الأنواع المرصودة ونصائح للمجموعات القادمة...',
      distancePlaceholder: 'المسافة (كم، اختياري)',
      elevationPlaceholder: 'الارتفاع +م (اختياري)',
      photoPlaceholder: 'رابط الصورة (https://... اختياري)',
      emptyTitleSignedIn: 'لا توجد أنشطة منشورة حاليًا.',
      emptyTitleSignedOut: 'سجّل الدخول عبر Google لعرض ومشاركة الأنشطة الميدانية.',
      emptySubtitle: 'شارك آخر رحلة مشي أو رصد للحياة البرية أو تخييم لبدء النقاش.',
      bravo: 'إعجاب',
      comments: 'التعليقات',
      noComments: 'لا توجد تعليقات بعد. كن أول من يعلّق!',
      commentPlaceholder: 'أضف تعليقًا على نشاط',
      signInToComment: 'سجّل الدخول عبر Google للتعليق',
      roomReadySuffix: 'جاهز للمحادثة المباشرة',
      roomReadyDesc: 'اسأل عن حالة المسار، نسّق سيارة 4x4 مشتركة أو شارك تنبيهًا جويًا مباشرًا.',
      chatPlaceholderPrefix: 'رسالة في',
      signInToChat: 'سجّل الدخول عبر Google للكتابة في الدردشة',
      you: 'أنت',
      activityTypes: {
        RANDONNEE: 'مشي جبلي',
        FAUNE: 'حياة برية ونباتات',
        BIVOUAC: 'تخييم',
        ECO_ACTION: 'مبادرة بيئية',
      },
    },
    gallery: {
      kicker: 'مكتبة صور Mangorema · المحميات والرحلات',
      title: 'معرض صور الغابون',
      subtitle: 'مناظر استوائية وذكريات تخييم ولقطات ميدانية يشاركها المستكشفون عبر المحميات الطبيعية.',
      addPhotoBtn: 'إضافة صورة',
      totalPhotosLabel: 'صورة',
      parksCoveredLabel: 'مواقع ممثلة',
      favoritesLabel: 'المفضلة',
      filterAll: 'الكل',
      filterLandscapes: 'المناظر',
      filterExpeditions: 'الرحلات',
      filterCommunity: 'المجتمع',
      filterFavorites: 'مفضلتي',
      allSitesOption: 'جميع مواقع الغابون',
      searchPlaceholder: 'ابحث عن محمية أو عنوان أو مستكشف...',
      viewGridAria: 'عرض تحريري',
      viewCompactAria: 'عرض فسيفسائي',
      emptyTitle: 'لا توجد صور مطابقة للبحث',
      emptySubtitle: 'عدّل معايير البحث أو انشر أول لقطة من إحدى محميات الغابون.',
      resetFilters: 'إعادة ضبط الفلاتر',
      sourceLandscape: 'منظر رسمي',
      sourceExpedition: 'رحلة استكشافية',
      sourceCommunity: 'ميدان · المجتمع',
      sourceReview: 'تقييم رحّال',
      favoriteAdd: 'إضافة للمفضلة',
      favoriteRemove: 'إزالة من المفضلة',
      applyBackdrop: 'تعيين كخلفية للتطبيق',
      backdropApplied: 'الخلفية النشطة',
      contactAuthor: 'مراسلة خاصة',
      openLightboxAria: 'تكبير الصورة',
      prevPhotoAria: 'الصورة السابقة',
      nextPhotoAria: 'الصورة التالية',
      downloadPhoto: 'تحميل',
      featuredTag: 'مختارة',
      uploadModalTitle: 'نشر صورة في المعرض',
      uploadModalSubtitle: 'شارك لقطة مع المجتمع في إحدى محميات الغابون أو احفظها في ألبومك الشخصي.',
      uploadDestSite: 'موقع في الغابون (سحابة عامة)',
      uploadDestPersonal: 'ألبوم رحلاتي الشخصي',
      titleLabel: 'عنوان الصورة',
      titlePlaceholder: 'مثال: شروق الشمس على بحيرة إيغيلا',
      parkLabel: 'المحمية / الموقع في الغابون',
      captionLabel: 'الوصف أو الملاحظة الميدانية',
      captionPlaceholder: 'صف اللحظة أو المسار أو الحياة البرية المرصودة...',
      submitBtn: 'نشر في المعرض',
      errMissingImage: 'يرجى التقاط صورة أو اختيارها من جهازك.',
      errMissingTitle: 'يرجى كتابة عنوان للصورة.',
      errSignInSite: 'سجّل الدخول عبر Google للنشر في موقع عام، أو اختر «ألبوم رحلاتي الشخصي».',
      toastBackdropTitle: 'تم تحديث الخلفية',
      toastBackdropDesc: 'تعرض الخلفية الزجاجية الآن:',
      toastPersonalTitle: 'تمت إضافة الصورة للمعرض',
      toastPersonalDesc: 'تم حفظ لقطتك في ألبوم الرحلات والمفضلة.',
    },
    favoriteModal: {
      kicker: 'معرض رحلات الغابون',
      title: 'اختيار صوري المفضلة',
      subtitleTitle: 'اختر أجمل لقطاتك',
      subtitleHint: 'ستظهر في واجهة ملفك الشخصي للمستكشف (بحد أقصى 6).',
      tabAll: 'الكل',
      tabFavorites: 'المفضلة',
      tabUpload: 'إضافة صورة',
      maxSixError: 'يمكنك اختيار ما يصل إلى 6 صور مفضلة لعرضها في ملفك الشخصي.',
      invalidFormatError: 'صيغة غير مدعومة. اختر صورة JPG أو PNG أو WEBP أو GIF.',
      tooLargeError: 'حجم الصورة كبير جدًا (الحد الأقصى 6 ميجابايت).',
      corruptFileError: 'ملف الصورة غير صالح أو تالف.',
      missingImageError: 'يرجى اختيار صورة من جهازك أو إدخال رابط صورة.',
      invalidUrlError: 'رابط الصورة غير صالح. استخدم رابط https:// أو ملف JPG/PNG/WEBP.',
      missingTitleError: 'يرجى إدخال عنوان للصورة.',
      defaultCaption: 'صورة شخصية مضافة إلى سجل رحلاتي في MANGOREMA.',
      removeFavTitle: 'إزالة من المفضلة',
      addFavTitle: 'إضافة إلى المفضلة',
      zoomTitle: 'تكبير',
      chooseFileBtn: 'اختر صورة من جهازي',
      supportedFormats: 'الصيغ المدعومة: JPG و PNG و WEBP',
      orUrlLabel: 'أو أدخل رابط صورة (URL):',
      titleLabel: 'عنوان الصورة:',
      titlePlaceholder: 'مثال: أمسية تخييم في كاب إستيرياس',
      parkLabel: 'المحمية / الموقع في الغابون:',
      captionLabel: 'التعليق / قصة الرحلة:',
      captionPlaceholder: 'بضع كلمات حول هذه اللحظة المميزة...',
      saveUploadBtn: 'حفظ وإضافة للمفضلة',
      validateSelectionBtn: 'اعتماد الاختيار',
      addToFavBtn: 'إضافة إلى صوري المفضلة',
      removeFromFavBtn: 'إزالة من صوري المفضلة',
    },
    ads: {
      sponsoredLabel: 'إعلان ممول',
      hideAdTitle: 'إخفاء هذا الإعلان',
      codePrefix: 'الرمز',
      removeAdsBtn: 'تفعيل بدون إعلانات',
      promoCodeLabel: 'رمز الشريك الترويجي',
      copyBtn: 'نسخ',
      copiedLabel: 'تم النسخ',
      freeTierNotice: 'تظهر الإعلانات الممولة فقط في النسخة المجانية من MANGOREMA.',
      planUpdatedToastTitle: 'تم تحديث باقة MANGOREMA',
      planFreeToastDesc: 'الباقة المجانية نشطة (مع إعلانات شركاء الغابون).',
      planPaidToastDesc: 'تم تفعيل التصفح بدون إعلانات لحسابك.',
    },
  },
};
