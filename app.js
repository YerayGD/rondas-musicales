import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rondasService } from '../services/rondasService';
import ProponerCancionForm from '../components/rondas/ProponerCancionForm';
import VotarCancionForm from '../components/rondas/VotarCancionForm';

export default function RondaDetalles() {
 const { id } = useParams();
 const navigate = useNavigate();
 const [ronda, setRonda] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [showProponerForm, setShowProponerForm] = useState(false);
 const [showVotarForm, setShowVotarForm] = useState(false);
 const [selectedSong, setSelectedSong] = useState(null);

 useEffect(() => {
   cargarRonda();
 }, [id]);

 const cargarRonda = async () => {
   try {
     const data = await rondasService.obtenerRonda(id);
     setRonda(data);
     setError(null);
   } catch (error) {
     console.error('Error al cargar ronda:', error);
     setError('Error al cargar la información de la ronda');
   } finally {
     setLoading(false);
   }
 };

 const handleVotarClick = (song) => {
   setSelectedSong(song);
   setShowVotarForm(true);
 };

 const handleVoteSuccess = () => {
   setShowVotarForm(false);
   setSelectedSong(null);
   cargarRonda();
 };

 const formatDate = (dateString) => {
   return new Date(dateString).toLocaleString('es-ES', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   });
 };

 if (loading) {
   return (
     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
       <div className="text-gray-500">Cargando...</div>
     </div>
   );
 }

 if (error) {
   return (
     <div className="min-h-screen bg-gray-100 p-4">
       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
         {error}
       </div>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-gray-100">
     <nav className="bg-white shadow">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between h-16">
           <div className="flex items-center">
             <button
               onClick={() => navigate('/dashboard')}
               className="text-gray-500 hover:text-gray-700 font-medium"
             >
               ← Volver al Dashboard
             </button>
           </div>
         </div>
       </div>
     </nav>

     <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
       {ronda && (
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
           <div className="px-4 py-5 sm:px-6">
             <h3 className="text-lg leading-6 font-medium text-gray-900">
               {ronda.name}
             </h3>
             <p className="mt-1 max-w-2xl text-sm text-gray-500">
               Finaliza: {formatDate(ronda.end_date)}
             </p>
           </div>

           <div className="border-t border-gray-200">
             <div className="px-4 py-5 sm:p-6">
               <button
                 onClick={() => setShowProponerForm(true)}
                 className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               >
                 Proponer Canción
               </button>

               <div className="mt-6">
                 <h4 className="text-lg font-medium mb-4">Canciones Propuestas</h4>
                 {ronda.songs && ronda.songs.length > 0 ? (
                   <ul className="divide-y divide-gray-200">
                     {ronda.songs.map((song) => (
                       <li key={song.id} className="py-4">
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="text-sm font-medium text-gray-900">{song.title}</p>
                             <p className="text-sm text-gray-500">{song.artist}</p>
                             <p className="text-xs text-gray-400">Duración: {song.duration}</p>
                           </div>
                           <div className="flex items-center space-x-4">
                             <span className="text-sm text-gray-500">
                               {song.votes} {song.votes === 1 ? 'voto' : 'votos'}
                             </span>
                             <button
                               onClick={() => handleVotarClick(song)}
                               className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50"
                             >
                               Votar
                             </button>
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-gray-500 text-center">No hay canciones propuestas aún</p>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}
     </main>

     {showProponerForm && (
       <ProponerCancionForm
         rondaId={id}
         onClose={() => setShowProponerForm(false)}
         onSuccess={() => {
           setShowProponerForm(false);
           cargarRonda();
         }}
       />
     )}

     {showVotarForm && selectedSong && (
       <VotarCancionForm
         rondaId={id}
         songId={selectedSong.id}
         onClose={() => {
           setShowVotarForm(false);
           setSelectedSong(null);
         }}
         onSuccess={handleVoteSuccess}
       />
     )}
   </div>
 );
}
