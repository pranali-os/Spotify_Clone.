import React from 'react'
import { useState, useEffect } from 'react'
import useAuth from './useAuth'
import Player from './Player'
import TrackSearchResult from './TrackSearchResult'
import { Container, Form } from 'react-bootstrap'
import SpotifyWebApi from 'spotify-web-api-node'


import axios from 'axios'



const SpotifyApi =new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

export default function Dashboard({code}) {
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [PlayingTrack, setPlayingTrack] = useState()
    const [lyrics, setLyrics] = useState()
   
    function chooseTrack(track) {
        setPlayingTrack(track)
        setSearch('')
        setLyrics("")
    }

    useEffect(() => {
        if (!PlayingTrack) return

        axios.get('http://localhost:3001/lyrics', {
            params: {
                track: PlayingTrack.title,
                artist: PlayingTrack.artist
            }
        }).then(res => {
            setLyrics(res.data.lyrics)
        })

    }, [PlayingTrack])
   
    useEffect(() => {
        if (!accessToken) return
        SpotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if (!search) return setSearchResults([])
        if (!accessToken) return 
        
        let cancel = false
        SpotifyApi.searchTracks(search).then(res => {
            if (cancel) return 
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce(
                    (smallest, image) => {
                        if (image.height < smallest.height) return image
                        return smallest
                    }, track.album.images[0])
                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url
                }
            }))
        })
        
        return () => cancel = true
    }, [search, accessToken])
    return (
        <div className="bg-secondary text-white">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">
                    <img src="/Spotify_Logo_RGB_Green.png" alt="logo" width="271" height="86" className="d-inline-block align-text-top"/>
                </a>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll" area-controls="navbarScroll" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon" ></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarScroll">
               <ul className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll">
                   <li className="nav-item">
                      <a href="#" className="nav-link active" aria-current="page">Account</a>
                    </li>
                    <li className="nav-item">
                      <a href="#" className="nav-link">Your Playlist</a>
                    </li>
                </ul>
            </div>
            
        </nav>
        <Container className="d-flex flex-column py-2 bg-dark text-white" 
         style={{height: "100vh"}}>
         <Form.Control 
            type="search" 
            placeholder="Search Songs/Artist"
            value={search} 
            onChange={e => setSearch(e.target.value)} />

            <div className="flex-grow-1 my-2 bg-dark text-white}" style={{ overflowY: "auto" }}>
                {searchResults.map(track => (
                    <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack}   />
                ))}
                {searchResults.length === 0 && (
                    <div className="text-center" style={{ whiteSpace: "pre" }}>
                         {lyrics}
                    </div>
                     
                
                )}
                
            </div>
            <div className="badge bg-dark">
                <Player accessToken={accessToken} trackUri={PlayingTrack?.uri}/>
            </div>
        </Container>
        </div>
    )
}

