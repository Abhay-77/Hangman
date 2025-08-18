import { useParams, useSearchParams } from "react-router-dom"

const Game = () => {
  const {id} = useParams()
  const [searchParams] = useSearchParams()
  const username = searchParams.get("username")

  return (
    <>
      
    </>
  )
}

export default Game