document.addEventListener('DOMContentLoaded', () => {
    const playlistsApiUrl = 'https://playlist-production-d25b.up.railway.app/api';
    const musicasApiUrl = 'https://unimusica-production.up.railway.app';

    const searchInput = document.getElementById('search-input');
    const playlistsGrid = document.getElementById('playlists-grid');
    const musicasGrid = document.getElementById('musicas-grid');

    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const createModal = document.getElementById('create-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    const newPlaylistNameInput = document.getElementById('new-playlist-name');

    let selectedPlaylist = null;

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
                    <img src="${p.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'}" alt="${p.name || p.nome}">
                </div>
                <h3>${p.name || p.nome}</h3>
                <p class="text-gray">${p.musicas ? p.musicas.length + ' músicas' : '0 músicas'}</p>
            `;

            card.addEventListener('click', () => {
                selectedPlaylist = p;
                renderPlaylistDetail(p);
            });

            playlistsGrid.appendChild(card);
        });
    };

    const renderPlaylistDetail = (playlist) => {
        const detailContainer = document.getElementById('view-playlist-detail');
        detailContainer.classList.remove('hidden');
        document.getElementById('view-playlist-list').style.display = 'none';

        detailContainer.innerHTML = `
            <button id="back-to-list">← Voltar</button>
            <h2>${playlist.name || playlist.nome}</h2>
            <p>${playlist.description || playlist.descricao || ''}</p>
            <h3>Músicas da Playlist</h3>
            <div id="playlist-musicas"></div>
            <h3>Adicionar músicas</h3>
            <div id="musicas-to-add"></div>
        `;

        document.getElementById('back-to-list').addEventListener('click', () => {
            detailContainer.classList.add('hidden');
            document.getElementById('view-playlist-list').style.display = 'block';
            selectedPlaylist = null;
            fetchMyPlaylists();
            fetchMusicas();
        });

        renderPlaylistMusicas(playlist.musicas || []);
        fetchMusicasToAdd();
    };

    const renderPlaylistMusicas = (musicas) => {
        const container = document.getElementById('playlist-musicas');
        container.innerHTML = '';

        if (musicas.length === 0) {
            container.innerHTML = '<p class="text-gray">Nenhuma música nessa playlist.</p>';
            return;
        }

        musicas.forEach(m => {
            const nome = m.nome || m.title || 'Nome desconhecido';
            const artista = m.artista || m.artist || 'Artista desconhecido';

            const div = document.createElement('div');
            div.className = 'musica-card';
            div.textContent = `${nome} - ${artista}`;
            container.appendChild(div);
        });
    };

    const fetchMusicasToAdd = async () => {
        try {
            const response = await fetch(`${musicasApiUrl}/musicas`);
            if (!response.ok) throw new Error('Falha ao buscar músicas');
            const musicas = await response.json();
            renderMusicasToAdd(musicas);
        } catch (error) {
            console.error(error);
            const container = document.getElementById('musicas-to-add');
            if (container) container.innerHTML = '<p class="text-gray">Erro ao carregar as músicas.</p>';
        }
    };

    const renderMusicasToAdd = (musicas) => {
        const container = document.getElementById('musicas-to-add');
        container.innerHTML = '';

        if (!musicas || musicas.length === 0) {
            container.innerHTML = '<p class="text-gray">Nenhuma música encontrada.</p>';
            return;
        }

        musicas.forEach(m => {
            const nome = m.nome || m.title || 'Nome desconhecido';
            const artista = m.artista || m.artist || 'Artista desconhecido';
            const ano = m.anoLancamento || m.year || 'Ano desconhecido';
            const duracao = m.duracao || m.duration || 'Duração desconhecida';

            const card = document.createElement('div');
            card.className = 'musica-card';
            card.innerHTML = `
                <h4>${nome} - ${artista}</h4>
                <p>${ano} - ${duracao} min</p>
                <button class="add-music-btn">Adicionar</button>
            `;

            card.querySelector('.add-music-btn').addEventListener('click', () => {
                if (!selectedPlaylist) {
                    alert('Selecione uma playlist primeiro clicando nela.');
                    return;
                }
                addMusicToPlaylist(selectedPlaylist.id || selectedPlaylist._id, m.id || m._id);
            });

            container.appendChild(card);
        });
    };

    const addMusicToPlaylist = async (playlistId, musicId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}/musicas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ musicaId: musicId })
            });
            if (!response.ok) throw new Error('Falha ao adicionar música');
            alert('Música adicionada com sucesso!');
            fetchPlaylistById(playlistId);
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar música.');
        }
    };

    const fetchPlaylistById = async (playlistId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}`);
            if (!response.ok) throw new Error('Falha ao buscar playlist');
            const playlist = await response.json();
            selectedPlaylist = playlist;
            renderPlaylistDetail(playlist);
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar playlist.');
        }
    };

    const fetchMyPlaylists = async () => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists`);
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
            const response = await fetch(`${musicasApiUrl}/musicas`);
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
            const nome = m.nome || m.title || 'Nome desconhecido';
            const artista = m.artista || m.artist || 'Artista desconhecido';
            const ano = m.anoLancamento || m.year || 'Ano desconhecido';
            const duracao = m.duracao || m.duration || 'Duração desconhecida';

            const card = document.createElement('div');
            card.className = 'musica-card';
            card.innerHTML = `
                <h4>${nome} - ${artista}</h4>
                <p>${ano} - ${duracao} min</p>
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
            const response = await fetch(`${playlistsApiUrl}/playlists`, {
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
        document.getElementById('view-playlist-detail').classList.add('hidden');
        document.getElementById('view-playlist-list').style.display = 'block';
        fetchMyPlaylists();
    });

    tabDescobrir.addEventListener('click', () => {
        tabDescobrir.classList.add('active');
        tabMinhas.classList.remove('active');
        document.getElementById('create-playlist-container').style.display = 'none';
        document.getElementById('view-playlist-detail').classList.add('hidden');
        document.getElementById('view-playlist-list').style.display = 'block';
        playlistsGrid.innerHTML = '<p class="text-gray">Funcionalidade Descobrir ainda não implementada.</p>';
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
