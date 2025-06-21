const IMAGES = {
    
    restaurants: {
        supra: {
            name: "Супра",
            elementId: "supra",
            image: "assets/images/restaurants/Supra.jpg",
            imageFit: "cover", 
            imagePosition: "center" 
        },
        tokyoKawaii: {
            name: "Tokyo Kawaii",
            elementId: "tokyo",
            image: "assets/images/restaurants/Tokyo_Kawaii.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        millionka: {
            name: "Миллионка",
            elementId: "millionka",
            image: "assets/images/restaurants/Millionka.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        ilPatio: {
            name: "IL Патио",
            elementId: "ilpatio",
            image: "assets/images/restaurants/IL_Patio.jpg",
            imageFit: "cover",
            imagePosition: "center"
        }
    },
    
    
    bars: {
        bruggePub: {
            name: "Brugge Pub",
            elementId: "brugge",
            image: "assets/images/bars/Brugge_Pub.jpg",
            imageFit: "cover",
            imagePosition: "90% center",
        },
        atelier: {
            name: "Atelier",
            elementId: "atelier",
            image: "assets/images/bars/Atelier.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        mumiyTroll: {
            name: "Мумий Тролль",
            elementId: "mumiy",
            image: "assets/images/bars/Mummi_Troll.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        zhuklevich: {
            name: "Жуклевичъ",
            elementId: "zhuklevich",
            image: "assets/images/bars/Jiklevich.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        syndicate: {
            name: "Syndicate",
            elementId: "syndicate",
            image: "assets/images/bars/Syndicate.jpg", 
            imageFit: "cover",
            imagePosition: "center"
        },
        moonshine: {
            name: "Moonshine",
            elementId: "moonshine",
            image: "assets/images/bars/Moonshine.jpg", 
            imageFit: "cover",
            imagePosition: "center"
        }
    },
    
    
    offers: {
        summerTerraces: {
            title: "Лучшие летние террасы",
            image: "assets/images/offers/Summer_Terraces.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        romanticDinner: {
            title: "Романтический ужин",
            image: "assets/images/offers/Romantic_Dinner.jpg",
            imageFit: "cover",
            imagePosition: "center"
        },
        weeklyDiscounts: {
            title: "Скидки недели",
                image: "assets/images/offers/Weekly_Discounts.jpg",
            imageFit: "cover",
            imagePosition: "center"
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IMAGES;
} 
