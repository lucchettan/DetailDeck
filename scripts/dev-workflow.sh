#!/bin/bash

# 🚀 Script de workflow de développement Resaone
# Automatise le cycle dev → test → prod

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_PROJECT_ID="jtusofarsnwcfxnrvgus"
DEV_PROJECT_ID="shxnokjzkfnreolujhew"
GITHUB_OWNER="nicolaslucchetta"
GITHUB_REPO="DetailDeck"

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction: Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi

    # Vérifier que nous sommes dans un repo git
    if [ ! -d .git ]; then
        log_error "Ce script doit être exécuté dans le répertoire racine du projet Git"
        exit 1
    fi

    log_success "Prérequis vérifiés"
}

# Fonction: Créer une nouvelle branche de feature
start_feature() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        log_error "Nom de feature requis: ./dev-workflow.sh start <nom-feature>"
        exit 1
    fi

    log_info "Création de la branche feature/$feature_name..."

    # S'assurer qu'on est sur develop
    git checkout cursor/develop
    git pull origin cursor/develop

    # Créer la branche feature
    git checkout -b "feature/$feature_name"

    # Configurer l'environnement de dev
    cp .env.development .env.local

    log_success "Branche feature/$feature_name créée et environnement configuré"
    log_info "Vous pouvez maintenant développer avec: npm run dev:test"
}

# Fonction: Tester la feature
test_feature() {
    log_info "Test de la feature en cours..."

    # Vérifier le code
    npm run lint

    # Build de test
    npm run build:test

    log_success "Tests passés avec succès"
}

# Fonction: Merger vers develop
merge_to_develop() {
    local current_branch=$(git branch --show-current)

    if [[ ! $current_branch == feature/* ]]; then
        log_error "Vous devez être sur une branche feature pour merger"
        exit 1
    fi

    log_info "Merge de $current_branch vers cursor/develop..."

    # Tester avant le merge
    test_feature

    # Commit des changements en cours
    git add .
    git commit -m "feat: $(echo $current_branch | sed 's/feature\///')" || true

    # Merger vers develop
    git checkout cursor/develop
    git pull origin cursor/develop
    git merge --no-ff $current_branch
    git push origin cursor/develop

    # Nettoyer la branche feature
    git branch -d $current_branch

    log_success "Feature mergée vers cursor/develop"
}

# Fonction: Préparer la production
prepare_prod() {
    log_info "Préparation pour la production..."

    # S'assurer qu'on est sur develop
    git checkout cursor/develop
    git pull origin cursor/develop

    # Tests finaux
    test_feature

    # Merger vers main
    git checkout main
    git pull origin main
    git merge --no-ff cursor/develop

    log_success "Prêt pour la production"
    log_warning "N'oubliez pas de:"
    log_warning "1. Tester en production"
    log_warning "2. Appliquer les migrations DB si nécessaire"
    log_warning "3. Pousser vers main: git push origin main"
}

# Fonction: Seeder la DB de dev
seed_dev_db() {
    log_info "Seeding de la base de données de développement..."
    log_warning "Cette opération va réinitialiser la DB de dev avec des données de test"

    read -p "Continuer? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Opération annulée"
        exit 0
    fi

    # Le seeding sera fait via les outils MCP Supabase
    log_success "DB de dev seedée (à implémenter avec MCP)"
}

# Menu principal
case "$1" in
    "start")
        check_prerequisites
        start_feature "$2"
        ;;
    "test")
        check_prerequisites
        test_feature
        ;;
    "merge")
        check_prerequisites
        merge_to_develop
        ;;
    "prod")
        check_prerequisites
        prepare_prod
        ;;
    "seed")
        check_prerequisites
        seed_dev_db
        ;;
    *)
        echo "🚀 Workflow de développement Resaone"
        echo ""
        echo "Usage: $0 {start|test|merge|prod|seed}"
        echo ""
        echo "Commandes:"
        echo "  start <name>  - Créer une nouvelle feature"
        echo "  test          - Tester la feature courante"
        echo "  merge         - Merger vers develop"
        echo "  prod          - Préparer la production"
        echo "  seed          - Seeder la DB de dev"
        echo ""
        echo "Exemple:"
        echo "  $0 start nouvelle-fonctionnalite"
        echo "  $0 test"
        echo "  $0 merge"
        exit 1
        ;;
esac
