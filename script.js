document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://playlist-production-d25b.up.railway.app/api';

    const searchInput = document.getElementById('search-input');
    const playlistsGrid = document.getElementById('playlists-grid');
    const musicasGrid = document.getElementById('musicas-grid');

    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const createModal = document.getElementById('create-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    const newPlaylistNameInput = document.getElementById('new-playlist-name');

    const discoverPlaylists = [
        { id: 'd1', name: "Hits do Momento", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
        { id: 'd2', name: "Chill Vibes", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" }
    ];

    const renderPlaylists = (playlists) => {
        playlistsGrid.innerHTML = '';
        if (!playlists || playlists.length === 0) {
            playlistsGrid.innerHTML = '<p class="text-gray">Nenhuma playlist encontrada.</p>';
            return;
        }
        playlists.forEach(p => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.innerHTML = `
                <div class="cover-art">
                    <img src="${p.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'}" alt="${p.nome}">
                </div>
                <h3>${p.nome}</h3>
                <p class="text-gray">${p.musicas ? p.musicas.length + ' músicas' : ''}</p>
            `;
            playlistsGrid.appendChild(card);
        });
    };

    const fetchMyPlaylists = async () => {
        try {
            const response = await fetch(${apiUrl}/playlists);
            if (!response.ok) throw new Error('Falha ao buscar playlists');
            const data = await response.json();
            renderPlaylists(data);
        } catch (error) {
            console.error(error);
            playlistsGrid.innerHTML = '<p class="text-gray">Erro ao carregar suas playlists.</p>';
        }
    };


    const fetchMusicas = async () => {
        try {
            const response = await fetch(${apiUrl}/musicas);
            if (!response.ok) throw new Error('Falha ao buscar músicas');
            const musicas = await response.json();
            renderMusicas(musicas);
        } catch (error) {
            console.error(error);
            if (musicasGrid) musicasGrid.innerHTML = '<p class="text-gray">Erro ao carregar as músicas.</p>';
        }
    };

    const renderMusicas = (musicas) => {
        if (!musicasGrid) return;
        musicasGrid.innerHTML = '';
        if (!musicas || musicas.length === 0) {
            musicasGrid.innerHTML = '<p class="text-gray">Nenhuma música encontrada.</p>';
            return;
        }
        musicas.forEach(m => {
            const card = document.createElement('div');
            card.className = 'musica-card';
            card.innerHTML = `
                <h4>${m.nome} - ${m.artista}</h4>
                <p>${m.anoLancamento} - ${m.duracao} min</p>
            `;
            musicasGrid.appendChild(card);
        });
    };

    const createNewPlaylist = async () => {
        const name = newPlaylistNameInput.value;
        if (!name) {
            alert('Por favor, dê um nome para a playlist.');
            return;
        }
        try {
            const response = await fetch(${apiUrl}/playlists, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: name })
            });
            if (!response.ok) throw new Error('Falha ao criar playlist');
            closeModal();
            fetchMyPlaylists();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar a playlist.');
        }
    };

    const tabMinhas = document.getElementById('tab-minhas');
    const tabDescobrir = document.getElementById('tab-descobrir');

    tabMinhas.addEventListener('click', () => {
        tabMinhas.classList.add('active');
        tabDescobrir.classList.remove('active');
        document.getElementById('create-playlist-container').style.display = 'block';
        fetchMyPlaylists();
    });

    tabDescobrir.addEventListener('click', () => {
        tabDescobrir.classList.add('active');
        tabMinhas.classList.remove('active');
        document.getElementById('create-playlist-container').style.display = 'none';
        renderPlaylists(discoverPlaylists);
    });

    const openModal = () => createModal.classList.remove('hidden');
    const closeModal = () => {
        createModal.classList.add('hidden');
        newPlaylistNameInput.value = '';
    };

    createPlaylistBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    confirmCreateBtn.addEventListener('click', createNewPlaylist);

    lucide.createIcons();
    fetchMyPlaylists();
    fetchMusicas();
});