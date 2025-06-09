document.addEventListener('DOMContentLoaded', () => {
    // URLs das APIs
    const playlistsApiUrl = 'https://playlist-production-d25b.up.railway.app/api';
    const musicasApiUrl = 'https://unimusica-production.up.railway.app';

    // Elementos da página
    const searchInput = document.getElementById('search-input');
    const playlistsGrid = document.getElementById('playlists-grid');
    const musicasGrid = document.getElementById('musicas-grid');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const createModal = document.getElementById('create-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    const newPlaylistNameInput = document.getElementById('new-playlist-name');

    // Variáveis de estado
    let selectedPlaylist = null;
    let allMusicsMap = new Map(); // NOVO: Mapa para armazenar todas as músicas para consulta rápida

    // ====== FUNÇÕES DE RENDERIZAÇÃO ====== //

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
            <button id="back-to-list" class="back-btn">← Voltar</button>
            <div class="playlist-header">
                <input type="text" class="playlist-title-input" id="edit-nome" value="${playlist.nome}">
                <div class="action-buttons">
                    <button id="save-edits" class="save-btn">Salvar Edição</button>
                    <button id="delete-playlist" class="delete-btn">Excluir Playlist</button>
                </div>
            </div>

            <h3 class="section-title">Músicas na Playlist</h3>
            <div id="playlist-musicas" class="song-list"></div>

            <h3 class="section-title">Adicionar Músicas</h3>
            <div id="musicas-to-add" class="song-list"></div>
        `;

        document.getElementById('back-to-list').addEventListener('click', () => {
            detailContainer.classList.add('hidden');
            document.getElementById('view-playlist-list').style.display = 'block';
            selectedPlaylist = null;
            fetchMyPlaylists();
        });

        document.getElementById('save-edits').addEventListener('click', () => {
            const nome = document.getElementById('edit-nome').value;
            updatePlaylist(playlist.id || playlist._id, nome);
        });

        document.getElementById('delete-playlist').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta playlist?')) {
                deletePlaylist(playlist.id || playlist._id);
            }
        });

        fetchMusicasToAdd();
    };

    const renderPlaylistMusicas = (musicaIds) => {
        const container = document.getElementById('playlist-musicas');
        container.innerHTML = '';
        if (musicaIds.length === 0) {
            container.innerHTML = '<p class="text-gray">Nenhuma música nessa playlist.</p>';
            return;
        }

        musicaIds.forEach(musicId => {
            const musica = allMusicsMap.get(musicId);
            if (!musica) return; // Pula se a música não foi encontrada no mapa

            const div = document.createElement('div');
            div.className = 'song-item';
            div.innerHTML = `
                <div class="song-details">
                    <span class="song-name">${musica.nome}</span>
                    <span class="song-meta">${musica.artista}</span>
                </div>
                <button class="action-btn remove-music-btn">Remover</button>
            `;
            div.querySelector('.remove-music-btn').addEventListener('click', () => {
                if (selectedPlaylist) {
                    // Passa o ID correto para a função de remover
                    removeMusicFromPlaylist(selectedPlaylist.id || selectedPlaylist._id, musicId);
                }
            });
            container.appendChild(div);
        });
    };

    const renderMusicasToAdd = (musicas) => {
        const container = document.getElementById('musicas-to-add');
        container.innerHTML = '';
        if (!musicas || musicas.length === 0) {
            container.innerHTML = '<p class="text-gray">Nenhuma música encontrada.</p>';
            return;
        }

        const musicasNaPlaylist = new Set(selectedPlaylist.musicas || []);

        musicas.forEach(m => {
            if (musicasNaPlaylist.has(m.id || m._id)) {
                return;
            }

            const card = document.createElement('div');
            card.className = 'song-item';
            card.innerHTML = `
                <div class="song-details">
                    <span class="song-name">${m.nome}</span>
                    <span class="song-meta">${m.artista} • ${m.anoLancamento}</span>
                </div>
                <button class="action-btn add-music-btn">Adicionar</button>
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


    const renderMusicas = (musicas) => {
        if (!musicasGrid) return;
        musicasGrid.innerHTML = '';
        if (!musicas || musicas.length === 0) {
            musicasGrid.innerHTML = '<p class="text-gray">Nenhuma música encontrada.</p>';
            return;
        }

        musicas.forEach(m => {
            const div = document.createElement('div');
            div.className = 'musica-card';
            div.textContent = `${m.nome} - ${m.artista}`;
            musicasGrid.appendChild(div);
        });
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


    const fetchMusicasToAdd = async () => {
        try {
            const response = await fetch(`${musicasApiUrl}/musicas`);
            if (!response.ok) throw new Error('Falha ao buscar músicas');
            const musicas = await response.json();

            allMusicsMap.clear();
            musicas.forEach(m => allMusicsMap.set(m.id || m._id, m));

            renderMusicasToAdd(musicas);

            if (selectedPlaylist) {
                renderPlaylistMusicas(selectedPlaylist.musicas || []);
            }
        } catch (error) {
            console.error(error);
            const container = document.getElementById('musicas-to-add');
            if (container) container.innerHTML = '<p class="text-gray">Erro ao carregar as músicas.</p>';
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

    const fetchPlaylistById = async (playlistId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}`);
            if (!response.ok) throw new Error('Falha ao buscar playlist');
            const playlist = await response.json();
            selectedPlaylist = playlist; // Atualiza a playlist selecionada com os novos dados
            renderPlaylistDetail(playlist); // Re-renderiza a tela com os dados atualizados
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar a visualização da playlist.');
        }
    };

    const addMusicToPlaylist = async (playlistId, musicId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}/musicas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ musicaId: musicId })
            });
            if (!response.ok) throw new Error('Falha ao adicionar música');
            fetchPlaylistById(playlistId); // Atualiza a view
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar música.');
        }
    };

    const removeMusicFromPlaylist = async (playlistId, musicId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}/musicas/${musicId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Falha ao remover música');
            fetchPlaylistById(playlistId); // Atualiza a view
        } catch (error) {
            console.error(error);
            alert('Erro ao remover música.');
        }
    };

    const updatePlaylist = async (playlistId, nome) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });
            if (!response.ok) throw new Error('Falha ao editar playlist');
            alert('Playlist atualizada!');
            fetchPlaylistById(playlistId);
        } catch (error) {
            console.error(error);
            alert('Erro ao editar playlist.');
        }
    };

    const deletePlaylist = async (playlistId) => {
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists/${playlistId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Falha ao excluir playlist');
            alert('Playlist excluída!');
            document.getElementById('view-playlist-detail').classList.add('hidden');
            document.getElementById('view-playlist-list').style.display = 'block';
            fetchMyPlaylists();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir playlist.');
        }
    };

    // ====== CONTROLES E EVENTOS ====== //

    createPlaylistBtn.addEventListener('click', () => {
        createModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        createModal.classList.add('hidden');
        newPlaylistNameInput.value = '';
    });

    confirmCreateBtn.addEventListener('click', async () => {
        const nome = newPlaylistNameInput.value.trim();
        if (nome === '') {
            alert('Digite um nome para a playlist.');
            return;
        }
        try {
            const response = await fetch(`${playlistsApiUrl}/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });
            if (!response.ok) throw new Error('Erro ao criar playlist');
            alert('Playlist criada com sucesso!');
            createModal.classList.add('hidden');
            newPlaylistNameInput.value = '';
            fetchMyPlaylists();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar playlist.');
        }
    });

    let debounceTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async () => {
            const query = searchInput.value.toLowerCase();
            if (!query) {
                fetchMyPlaylists();
                return;
            }
            try {
                const response = await fetch(`${playlistsApiUrl}/playlists`);
                const data = await response.json();
                const filtered = data.filter(p => p.nome.toLowerCase().includes(query));
                renderPlaylists(filtered);
            } catch(error) {
                console.error("Erro na busca: ", error);
            }
        }, 300);
    });

    fetchMyPlaylists();
    fetchMusicas();
});